export interface LotteryItemCandidate {
  name: string;
  level: number;
}

export interface ItemLotteryDto {
  candidates: LotteryItemCandidate[];
  expireAt: number;
  pickedIndex: number;
}
