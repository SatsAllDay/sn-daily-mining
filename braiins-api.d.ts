declare module "braiins-api" {
  type DailyReward = {
    date: number;
    total_reward: string;
    mining_reward: string;
    bos_plus_reward: string;
    referral_bonus: string;
    referral_reward: string;
    calculation_date: number;
  };

  type DailyRewardApiResponse = {
    btc: {
      daily_rewards: Array<DailyReward>;
    };
  };
}
