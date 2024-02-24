import fs from "fs";
import path from "path";

import type {
  DonateResponse,
  SearchResponse,
  UpsertCommentResponse,
} from "sn-api";

const SESSION_TOKEN_COOKIE_NAME = "__Secure-next-auth.session-token";

const SUB_FIELDS_FRAGMENT = `
fragment SubFields on Sub {
    name
    postTypes
    allowFreebies
    rankingType
    billingType
    billingCost
    billingAutoRenew
    billedLastAt
    baseCost
    userId
    desc
    status
    moderated
    moderatedCount
    meMuteSub
    __typename
  }`;

const ITEM_FIELDS_FRAGMENT = `
  fragment ItemFields on Item {
    id
    parentId
    createdAt
    deletedAt
    title
    url
    user {
      id
      name
      optional {
        streak
        __typename
      }
      meMute
      __typename
    }
    sub {
      name
      userId
      moderated
      meMuteSub
      __typename
    }
    otsHash
    position
    sats
    boost
    bounty
    bountyPaidTo
    noteId
    path
    upvotes
    meSats
    meDontLikeSats
    meBookmark
    meSubscription
    meForward
    outlawed
    freebie
    bio
    ncomments
    commentSats
    lastCommentAt
    maxBid
    isJob
    company
    location
    remote
    subName
    pollCost
    status
    uploadId
    mine
    imgproxyUrls
    __typename
  }`;

const ITEM_FULL_FIELDS_FRAGMENT = `
  fragment ItemFullFields on Item {
    ...ItemFields
    text
    root {
      id
      title
      bounty
      bountyPaidTo
      subName
      user {
        id
        name
        optional {
          streak
          __typename
        }
        __typename
      }
      sub {
        name
        userId
        moderated
        meMuteSub
        __typename
      }
      __typename
    }
    forwards {
      userId
      pct
      user {
        name
        __typename
      }
      __typename
    }
    __typename
  }`;

const QUERY_SUB_SEARCH = `
  query SubSearch($sub: String, $q: String, $cursor: String, $sort: String, $what: String, $when: String, $from: String, $to: String) {
    sub(name: $sub) {
      ...SubFields
      __typename
    }
    search(
      sub: $sub
      q: $q
      cursor: $cursor
      sort: $sort
      what: $what
      when: $when
      from: $from
      to: $to
    ) {
      cursor
      items {
        ...ItemFullFields
        searchTitle
        searchText
        __typename
      }
      __typename
    }
  }`;

const getCookie = async () => {
  return fs.promises.readFile(path.join(__dirname, ".session-cookie"), "utf-8");
};

const writeCookie = async (content: string) => {
  if (!content) {
    console.log("attempted to write empty cookie. skipping");
    return;
  }
  console.log("storing new session cookie...", content);
  return fs.promises.writeFile(
    path.join(__dirname, ".session-cookie"),
    content,
    "utf-8"
  );
};

const extractCookieFromResponse = async (response: Response) => {
  const setCookieHeader = response.headers.getSetCookie();
  const singleCookie = setCookieHeader.find((header) =>
    header.startsWith(SESSION_TOKEN_COOKIE_NAME)
  );
  if (singleCookie) {
    const setCookie = singleCookie.split(";")[0].split("=")[1];
    if (setCookie) {
      await writeCookie(setCookie);
    } else {
      console.log("failed to parse session cookie");
    }
  } else {
    console.log("no session set cookie");
  }
};

const authedApiCall = async <ResponseType>({ body }: { body: string }) => {
  const cookie = await getCookie();
  const response = await fetch("https://stacker.news/api/graphql/", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Cookie: `${SESSION_TOKEN_COOKIE_NAME}=${cookie}`,
    },
    body,
  });
  extractCookieFromResponse(response);
  return response.json() as ResponseType;
};

export const donateToRewards = async ({ sats }: { sats: number }) => {
  try {
    const body = JSON.stringify({
      operationName: "donateToRewards",
      variables: {
        sats,
      },
      query: `
          mutation donateToRewards($sats: Int!, $hash: String, $hmac: String) {
            donateToRewards(sats: $sats, hash: $hash, hmac: $hmac)
          }`,
    });

    const jsonResponse = await authedApiCall<DonateResponse>({ body });
    const {
      data: { donateToRewards: donatedAmount },
    } = jsonResponse;
    return { donatedAmount };
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const createComment = async ({
  parentId,
  text,
}: {
  parentId: string;
  text: string;
}) => {
  try {
    const body = JSON.stringify({
      operationName: "upsertComment",
      variables: {
        parentId,
        text,
      },
      query: `
          mutation upsertComment($text: String!, $parentId: ID!, $hash: String, $hmac: String) {
              upsertComment(text: $text, parentId: $parentId, hash: $hash, hmac: $hmac) {
                id
              }
            }
          `,
    });
    const jsonResponse = await authedApiCall<UpsertCommentResponse>({
      body,
    });
    const {
      data: {
        upsertComment: { id: newCommentId },
      },
    } = jsonResponse;
    return { newCommentId };
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const search = async ({
  what,
  nym,
  cursor,
}: {
  cursor?: string;
  what?: string;
  nym?: string;
}) => {
  try {
    const body = JSON.stringify({
      operationName: "SubSearch",
      variables: {
        q: nym ? `nym:${nym}` : "",
        what,
        sort: "recent",
        cursor,
      },
      query: `
              ${SUB_FIELDS_FRAGMENT}
              ${ITEM_FIELDS_FRAGMENT}
              ${ITEM_FULL_FIELDS_FRAGMENT}
              ${QUERY_SUB_SEARCH}
          `,
    });
    const jsonResponse = await authedApiCall<SearchResponse>({ body });
    const {
      data: {
        search: { cursor: responseCursor, items },
      },
    } = jsonResponse;
    return { cursor: responseCursor, items };
  } catch (err) {
    console.error(err);
    return { cursor: "", items: [] };
  }
};
