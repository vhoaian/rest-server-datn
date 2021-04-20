const SUCCESS_CODE = 0;

export function nomalizeResponse(
  data: unknown = null,
  errorCode: number = SUCCESS_CODE,
  pagingInfo?: { totalPage: number; currentPage: number; perPage: number }
) {
  return { errorCode, data, pagingInfo };
}
