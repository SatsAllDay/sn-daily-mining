import { DailyRewardApiResponse } from "braiins-api";

const getToken = () => {
  return process.env.BRAIINS_TOKEN || "foo";
};

export const getMostRecentMiningSats = async () => {
  const token = getToken();
  const fetchResponse = await fetch(
    "https://pool.braiins.com/accounts/rewards/json/btc",
    {
      method: "GET",
      headers: {
        "SlushPool-Auth-Token": token,
      },
    }
  );
  const responseJson = (await fetchResponse.json()) as DailyRewardApiResponse;
  const {
    btc: { daily_rewards: dailyRewards },
  } = responseJson;
  dailyRewards.sort((o1, o2) => o2.date - o1.date);
  const mostRecent = dailyRewards[0];
  const minedSats = Number(mostRecent.mining_reward) * 100000000; // expressed in BTC units, so scale it to sats
  return Math.floor(minedSats);
};
