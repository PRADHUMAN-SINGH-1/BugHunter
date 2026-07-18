jest.mock("jspdf", () => jest.fn());

import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the BugHunter AI security workspace', () => {
  render(<App />);
  expect(screen.getByText(/Your AI Application Security Engineer/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Describe an authorized target/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Analyze Demo Application/i })).toBeInTheDocument();
});
