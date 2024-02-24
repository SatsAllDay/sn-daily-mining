import "dotenv/config";

import { getMostRecentMiningSats } from "./braiins";
import { createComment, donateToRewards, search } from "./sn";

const getMonthAbbr = (num: number) =>
  [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][num];

const main = async () => {
  // optionally load sats via process.env
  let todaySats: string | number | undefined = process.env.SATS;
  if (!todaySats) {
    todaySats = await getMostRecentMiningSats();
    // Add some slight variation to the number to avoid doxxing
    const randOffset = Math.floor(Math.random() * 5);
    // randomly add or subtract the offset for some variance
    if (Math.random() > 0.5) {
      todaySats += randOffset;
    } else {
      todaySats -= randOffset;
    }
  }

  const myComments = [];
  let cursor;
  let done = false;
  let counter = 0;
  const max = 20;
  while (!done) {
    const { cursor: responseCursor, items } = await search({
      cursor,
      what: "comments",
      nym: "weareallsatoshi",
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
    counter++;
    console.log("request counter: " + counter);
    if (responseCursor === null || counter === max) {
      done = true;
    }
    myComments.push(...items);
    cursor = responseCursor;
  }
  const dailyMiningComments = myComments
    .filter((comment) => /^Day \d+ of posting/.test(comment.text))
    .sort(
      (comment1, comment2) =>
        new Date(comment2.createdAt).getTime() -
        new Date(comment1.createdAt).getTime()
    );
  const mostRecentDailyComment = dailyMiningComments[0];
  console.log(mostRecentDailyComment);
  const { id: mostRecentDailyCommentId } = mostRecentDailyComment;
  const rxResult =
    /^Day (\d+) of posting mining earnings from the day before: \d+ sats on (\d{1,2}[a-zA-Z]{1,4}\d{4})!\nRunning total: (\d+,?\d+) sats!/.exec(
      mostRecentDailyComment.text
    );
  if (!rxResult) {
    console.log(
      "Failed to match regex on most recent daily comment. Exiting..."
    );
    return;
  }
  const [, mostRecentDayCount, mostRecentDate, mostRecentTotal] = rxResult;

  console.log({
    mostRecentDayCount,
    mostRecentDate,
    mostRecentTotal,
    mostRecentDailyCommentId,
  });
  const yesterdayDate = new Date(Date.now() - 864e5);
  const nextComment = `Day ${
    Number(mostRecentDayCount) + 1
  } of posting mining earnings from the day before: ${todaySats} sats on ${yesterdayDate.getDate()}${getMonthAbbr(
    yesterdayDate.getMonth()
  )}${yesterdayDate.getFullYear()}!\nRunning total: ${Intl.NumberFormat().format(
    Number(mostRecentTotal.toString().replaceAll(",", "")) + Number(todaySats)
  )} sats!\n\n[Yesterday's comment](https://stacker.news/items/${mostRecentDailyCommentId}/r/WeAreAllSatoshi)`;
  console.log("Next comment:");
  console.log(nextComment);

  const { items: saloonPosts } = await search({ what: "posts", nym: "saloon" });
  const mostRecentSaloonPost = saloonPosts.sort(
    (post1, post2) =>
      new Date(post2.createdAt).getTime() - new Date(post1.createdAt).getTime()
  )[0];
  const saloonPostId = mostRecentSaloonPost.id;

  console.log("posting today's top level comment...");
  const { newCommentId } = await createComment({
    parentId: saloonPostId,
    text: nextComment,
  });

  const yesterdaysCommentReply = `[Day ${
    Number(mostRecentDayCount) + 1
  }'s comment](https://stacker.news/items/${newCommentId}/r/WeAreAllSatoshi)`;
  console.log("\nYesterdays comment reply:");
  console.log(yesterdaysCommentReply);

  console.log("posting the reply to yesterday's comment...");
  await createComment({
    parentId: mostRecentDailyCommentId,
    text: yesterdaysCommentReply,
  });
  console.log("posted!");

  console.log("making daily donation to rewards...");
  const { donatedAmount } = await donateToRewards({ sats: 100 });
  console.log(`donated ${donatedAmount} sats!`);
};

main().catch(console.error);
