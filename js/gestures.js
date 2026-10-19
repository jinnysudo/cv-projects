// Same finger logic as hand_gesture.py
export const TIP_IDS = [4, 8, 12, 16, 20];

export function fingersUp(lm) {
  const up = [];
  for (let i = 1; i < 5; i++) {
    up.push(lm[TIP_IDS[i]].y < lm[TIP_IDS[i] - 2].y ? 1 : 0);
  }
  // thumb: compare x of tip and the joint below it
  up.unshift(lm[TIP_IDS[0]].x > lm[TIP_IDS[0] - 1].x ? 1 : 0);
  return up;
}

export function gestureName(up) {
  const s = up.join("");
  if (s === "01100") return "Victory";
  if (s === "11111") return "Open Palm";
  if (s === "00000") return "Fist";
  return "";
}
