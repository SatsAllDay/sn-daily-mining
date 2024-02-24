declare module "sn-api" {
  type Item = {
    text: string;
    createdAt: string;
    id: string;
  };

  interface GraphQLResponse<T> {
    data: T;
  }

  type SearchResponse = GraphQLResponse<{
    search: {
      cursor: string;
      items: Array<Item>;
    };
  }>;

  type UpsertCommentResponse = GraphQLResponse<{
    upsertComment: {
      id: string;
    };
  }>;

  type DonateResponse = GraphQLResponse<{
    donateToRewards: number;
  }>;
}
