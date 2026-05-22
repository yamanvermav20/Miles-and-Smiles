import { render, screen } from "@testing-library/react";
import Toast from "./components/Toast.jsx";

describe("Toast component", () => {
  it("renders the provided message", () => {
    render(<Toast type="success" message="Hello world" />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("applies success styles by default", () => {
    const { container } = render(<Toast message="Success" />);
    expect(container.firstChild.className).toContain("bg-green-600");
  });
});

