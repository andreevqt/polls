import { getPaginationParams } from './pagination';

describe('getPaginationParams', () => {
  it('should return defaults when no params provided', () => {
    const result = getPaginationParams({});
    expect(result).toEqual({ skip: 0, take: 20, page: 1, limit: 20 });
  });

  it('should calculate correct skip for page 1', () => {
    const result = getPaginationParams({ page: 1, limit: 10 });
    expect(result.skip).toBe(0);
    expect(result.take).toBe(10);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it('should calculate correct skip for page 2', () => {
    const result = getPaginationParams({ page: 2, limit: 10 });
    expect(result.skip).toBe(10);
    expect(result.take).toBe(10);
  });

  it('should calculate correct skip for page 3', () => {
    const result = getPaginationParams({ page: 3, limit: 20 });
    expect(result.skip).toBe(40);
    expect(result.take).toBe(20);
  });

  it('should clamp page to minimum of 1 when page is 0', () => {
    const result = getPaginationParams({ page: 0, limit: 10 });
    expect(result.page).toBe(1);
    expect(result.skip).toBe(0);
  });

  it('should clamp page to minimum of 1 when page is negative', () => {
    const result = getPaginationParams({ page: -5, limit: 10 });
    expect(result.page).toBe(1);
    expect(result.skip).toBe(0);
  });

  it('should fall back to default limit of 20 when limit is 0 (falsy)', () => {
    // limit: 0 is falsy, so `query.limit || 20` returns 20
    const result = getPaginationParams({ page: 1, limit: 0 });
    expect(result.limit).toBe(20);
    expect(result.take).toBe(20);
  });

  it('should clamp limit to minimum of 1 when limit is negative', () => {
    // Math.max(1, -10) = 1
    const result = getPaginationParams({ page: 1, limit: -10 });
    expect(result.limit).toBe(1);
    expect(result.take).toBe(1);
  });

  it('should clamp limit to maximum of 100', () => {
    const result = getPaginationParams({ page: 1, limit: 500 });
    expect(result.limit).toBe(100);
    expect(result.take).toBe(100);
  });

  it('should allow limit of exactly 100', () => {
    const result = getPaginationParams({ page: 1, limit: 100 });
    expect(result.limit).toBe(100);
  });

  it('should use default page of 1 when page is undefined', () => {
    const result = getPaginationParams({ limit: 15 });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(15);
    expect(result.skip).toBe(0);
  });

  it('should use default limit of 20 when limit is undefined', () => {
    const result = getPaginationParams({ page: 2 });
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(20);
  });

  it('should return correct skip for large page numbers', () => {
    const result = getPaginationParams({ page: 100, limit: 20 });
    expect(result.skip).toBe(1980);
    expect(result.page).toBe(100);
  });
});
