import '@testing-library/jest-dom'
import { vi, beforeAll, afterAll } from 'vitest'

// happy-dom provides URL.createObjectURL but we mock it for predictable tests
if (typeof URL.createObjectURL === 'undefined') {
  Object.defineProperty(URL, 'createObjectURL', {
    value: vi.fn(() => 'blob:mock-url'),
    writable: true,
  })
} else {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
}

if (typeof URL.revokeObjectURL === 'undefined') {
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: vi.fn(),
    writable: true,
  })
} else {
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
}

// Suppress noisy console.error from React in tests
const originalConsoleError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = String(args[0])
    if (
      msg.includes('Warning:') ||
      msg.includes('ReactDOM.render') ||
      msg.includes('act(') ||
      msg.includes('inside a test was not wrapped in act')
    ) {
      return
    }
    originalConsoleError(...args)
  }
})

afterAll(() => {
  console.error = originalConsoleError
})
