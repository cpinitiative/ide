/* eslint-disable */
// @ts-nocheck
// copied from firepad
// note that if we want to allow users to change colors in the future, we'll have to update RealtimeEditor

function rgb2hex(r, g, b) {
  function digits(n) {
    var m = Math.round(255 * n).toString(16);
    return m.length === 1 ? '0' + m : m;
  }
  return '#' + digits(r) + digits(g) + digits(b);
}

function hsl2hex(h, s, l) {
  if (s === 0) {
    return rgb2hex(l, l, l);
  }
  var var2 = l < 0.5 ? l * (1 + s) : l + s - s * l;
  var var1 = 2 * l - var2;
  var hue2rgb = function (hue) {
    if (hue < 0) {
      hue += 1;
    }
    if (hue > 1) {
      hue -= 1;
    }
    if (6 * hue < 1) {
      return var1 + (var2 - var1) * 6 * hue;
    }
    if (2 * hue < 1) {
      return var2;
    }
    if (3 * hue < 2) {
      return var1 + (var2 - var1) * 6 * (2 / 3 - hue);
    }
    return var1;
  };
  return rgb2hex(hue2rgb(h + 1 / 3), hue2rgb(h), hue2rgb(h - 1 / 3));
}

export default function colorFromUserId(userId) {
  let a = 1;
  for (let i = 0; i < userId.length; i++) {
    a = (17 * (a + userId.charCodeAt(i))) % 360;
  }
  const hue = a / 360;

  return hsl2hex(hue, 0.75, 0.6);
}

export function bgColorFromUserId(userId) {
  let a = 1;
  for (let i = 0; i < userId.length; i++) {
    a = (17 * (a + userId.charCodeAt(i))) % 360;
  }
  const hue = a / 360;

  // Make the color darker so that it appears better in monaco
  return hsl2hex(hue, 0.4, 0.3);
}
