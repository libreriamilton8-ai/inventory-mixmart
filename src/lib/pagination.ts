export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 10;

export type PaginationParams = {
  page?: string;
  pageSize?: string;
};

export type Pagination = {
  page: number;
  pageSize: PageSize;
  skip: number;
  take: number;
};

export function readPagination(params: PaginationParams): Pagination {
  const rawSize = Number(params.pageSize);
  const pageSize: PageSize = (PAGE_SIZE_OPTIONS as readonly number[]).includes(
    rawSize,
  )
    ? (rawSize as PageSize)
    : DEFAULT_PAGE_SIZE;

  const rawPage = Math.floor(Number(params.page));
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function buildPaginationMeta(total: number, pagination: Pagination) {
  const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));
  const page = Math.min(pagination.page, totalPages);
  const start = total === 0 ? 0 : (page - 1) * pagination.pageSize + 1;
  const end = Math.min(total, page * pagination.pageSize);

  return {
    page,
    pageSize: pagination.pageSize,
    totalPages,
    totalItems: total,
    start,
    end,
  };
}
