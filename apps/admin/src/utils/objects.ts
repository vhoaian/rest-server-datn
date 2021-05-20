function objectPropertyFilter(
  object: Record<string, unknown>,
  select: string | string[]
) {
  let whitelist: string[] = [];
  if (typeof select == 'string') {
    whitelist = select.split(' ').filter(Boolean);
  } else {
    whitelist = select;
  }

  return whitelist.reduce((prev, cur) => {
    return typeof object[cur] == 'undefined'
      ? prev
      : { ...prev, [cur]: object[cur] };
  }, {});
}

export function withFilter(select: string | string[]) {
  return function (object: Record<string, unknown>) {
    return objectPropertyFilter(object, select);
  };
}
