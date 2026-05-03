import type { UserFilters, PollFilters } from './AdvancedFilters';

export const defaultUserFilters: UserFilters = {
  search: '',
  role: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const defaultPollFilters: PollFilters = {
  search: '',
  visibility: '',
  isActive: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};
