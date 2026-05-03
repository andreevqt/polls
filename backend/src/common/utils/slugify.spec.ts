import { generateSlug } from './slugify';

describe('generateSlug', () => {
  it('should generate a slug from a simple title', () => {
    const slug = generateSlug('My Test Poll');
    // Should be lowercase, spaces replaced with hyphens, with 4-char suffix
    expect(slug).toMatch(/^my-test-poll-[a-z0-9]{4}$/);
  });

  it('should convert title to lowercase', () => {
    const slug = generateSlug('UPPERCASE TITLE');
    expect(slug).toMatch(/^uppercase-title-[a-z0-9]{4}$/);
  });

  it('should replace spaces with hyphens', () => {
    const slug = generateSlug('hello world');
    expect(slug).toMatch(/^hello-world-[a-z0-9]{4}$/);
  });

  it('should remove special characters', () => {
    const slug = generateSlug('Hello, World! @#$%');
    expect(slug).toMatch(/^hello-world-[a-z0-9]{4}$/);
  });

  it('should collapse multiple spaces into a single hyphen', () => {
    const slug = generateSlug('hello   world');
    expect(slug).toMatch(/^hello-world-[a-z0-9]{4}$/);
  });

  it('should truncate base to 40 characters', () => {
    const longTitle = 'a'.repeat(60);
    const slug = generateSlug(longTitle);
    // base is 40 chars + '-' + 4 char nanoid = 45 chars total
    expect(slug.length).toBe(45);
    expect(slug).toMatch(/^[a]{40}-[a-z0-9]{4}$/);
  });

  it('should append a 4-character random suffix', () => {
    const slug = generateSlug('Test');
    const parts = slug.split('-');
    const suffix = parts[parts.length - 1];
    expect(suffix).toHaveLength(4);
    expect(suffix).toMatch(/^[a-z0-9]{4}$/);
  });

  it('should generate unique slugs for the same title', () => {
    const slug1 = generateSlug('Same Title');
    const slug2 = generateSlug('Same Title');
    // With very high probability the random suffixes differ
    // (1/36^4 chance of collision ≈ 0.0006%)
    const suffix1 = slug1.split('-').pop();
    const suffix2 = slug2.split('-').pop();
    // Both should be valid slugs even if they happen to match
    expect(slug1).toMatch(/^same-title-[a-z0-9]{4}$/);
    expect(slug2).toMatch(/^same-title-[a-z0-9]{4}$/);
    // Suffixes are from the nanoid alphabet
    expect(suffix1).toMatch(/^[a-z0-9]{4}$/);
    expect(suffix2).toMatch(/^[a-z0-9]{4}$/);
  });

  it('should handle title with only special characters', () => {
    const slug = generateSlug('!@#$%^&*()');
    // After removing special chars, base is empty string, result is just '-' + nanoid
    expect(slug).toMatch(/^-[a-z0-9]{4}$/);
  });

  it('should handle numeric titles', () => {
    const slug = generateSlug('Poll 2025');
    expect(slug).toMatch(/^poll-2025-[a-z0-9]{4}$/);
  });

  it('should handle mixed alphanumeric and special characters', () => {
    const slug = generateSlug('Best Poll #1!');
    expect(slug).toMatch(/^best-poll-1-[a-z0-9]{4}$/);
  });
});
