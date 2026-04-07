import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

describe("Card", () => {
  it("renders with default size", () => {
    render(<Card data-testid="test-card">Card content</Card>);
    const card = screen.getByTestId("test-card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute("data-slot", "card");
    expect(card).toHaveAttribute("data-size", "default");
  });

  it("renders with sm size", () => {
    render(
      <Card size="sm" data-testid="test-card">
        Small card content
      </Card>,
    );
    const card = screen.getByTestId("test-card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute("data-slot", "card");
    expect(card).toHaveAttribute("data-size", "sm");
  });

  it("applies custom className", () => {
    render(
      <Card className="custom-card-class" data-testid="test-card">
        Card with custom class
      </Card>,
    );
    const card = screen.getByTestId("test-card");
    expect(card).toHaveClass("custom-card-class");
  });

  it("forwards additional props to the underlying div", () => {
    render(
      <Card data-testid="custom-card" id="card-1">
        Card with props
      </Card>,
    );
    const card = screen.getByTestId("custom-card");
    expect(card).toHaveAttribute("id", "card-1");
  });

  it("renders children correctly", () => {
    render(
      <Card>
        <span>Child element</span>
      </Card>,
    );
    expect(screen.getByText("Child element")).toBeInTheDocument();
  });

  it("applies correct styling classes for default size", () => {
    render(<Card data-testid="test-card">Default size card</Card>);
    const card = screen.getByTestId("test-card");
    expect(card).toHaveClass(
      "flex",
      "flex-col",
      "gap-4",
      "rounded-xl",
      "bg-card",
    );
  });

  it("applies correct styling classes for sm size", () => {
    render(
      <Card size="sm" data-testid="test-card">
        Small size card
      </Card>,
    );
    const card = screen.getByTestId("test-card");
    expect(card).toHaveClass("data-[size=sm]:gap-3", "data-[size=sm]:py-3");
  });
});

describe("CardHeader", () => {
  it("renders correctly with data-slot attribute", () => {
    render(
      <Card>
        <CardHeader data-testid="header-test">Header content</CardHeader>
      </Card>,
    );
    const header = screen.getByTestId("header-test");
    expect(header).toBeInTheDocument();
    expect(header).toHaveAttribute("data-slot", "card-header");
  });

  it("applies custom className", () => {
    render(
      <Card>
        <CardHeader className="custom-header-class" data-testid="header-test">
          Header with custom class
        </CardHeader>
      </Card>,
    );
    const header = screen.getByTestId("header-test");
    expect(header).toHaveClass("custom-header-class");
  });

  it("forwards additional props", () => {
    render(
      <Card>
        <CardHeader data-testid="header-test" id="header-1">
          Header with props
        </CardHeader>
      </Card>,
    );
    const header = screen.getByTestId("header-test");
    expect(header).toHaveAttribute("id", "header-1");
  });

  it("renders children correctly", () => {
    render(
      <Card>
        <CardHeader>
          <span>Header child</span>
        </CardHeader>
      </Card>,
    );
    expect(screen.getByText("Header child")).toBeInTheDocument();
  });

  it("has correct styling classes", () => {
    render(
      <Card>
        <CardHeader data-testid="header-test">Styled header</CardHeader>
      </Card>,
    );
    const header = screen.getByTestId("header-test");
    expect(header).toHaveClass(
      "grid",
      "auto-rows-min",
      "items-start",
      "rounded-t-xl",
      "px-4",
    );
  });
});

describe("CardTitle", () => {
  it("renders correctly", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle data-testid="title-test">Card Title</CardTitle>
        </CardHeader>
      </Card>,
    );
    const title = screen.getByTestId("title-test");
    expect(title).toBeInTheDocument();
    expect(title).toHaveAttribute("data-slot", "card-title");
  });

  it("applies custom className", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle className="custom-title-class" data-testid="title-test">
            Custom styled title
          </CardTitle>
        </CardHeader>
      </Card>,
    );
    const title = screen.getByTestId("title-test");
    expect(title).toHaveClass("custom-title-class");
  });

  it("forwards additional props", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle data-testid="title-test" id="title-1">
            Title with props
          </CardTitle>
        </CardHeader>
      </Card>,
    );
    const title = screen.getByTestId("title-test");
    expect(title).toHaveAttribute("id", "title-1");
  });

  it("has correct default styling classes", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle data-testid="title-test">Styled title</CardTitle>
        </CardHeader>
      </Card>,
    );
    const title = screen.getByTestId("title-test");
    expect(title).toHaveClass(
      "font-heading",
      "text-base",
      "leading-snug",
      "font-medium",
    );
  });

  it("renders nested content correctly", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>
            <span>Nested title content</span>
          </CardTitle>
        </CardHeader>
      </Card>,
    );
    expect(screen.getByText("Nested title content")).toBeInTheDocument();
  });
});

describe("CardContent", () => {
  it("renders correctly", () => {
    render(
      <Card>
        <CardContent data-testid="content-test">Card content</CardContent>
      </Card>,
    );
    const content = screen.getByTestId("content-test");
    expect(content).toBeInTheDocument();
    expect(content).toHaveAttribute("data-slot", "card-content");
  });

  it("applies custom className", () => {
    render(
      <Card>
        <CardContent
          className="custom-content-class"
          data-testid="content-test"
        >
          Custom styled content
        </CardContent>
      </Card>,
    );
    const content = screen.getByTestId("content-test");
    expect(content).toHaveClass("custom-content-class");
  });

  it("forwards additional props", () => {
    render(
      <Card>
        <CardContent data-testid="content-test" id="content-1">
          Content with props
        </CardContent>
      </Card>,
    );
    const content = screen.getByTestId("content-test");
    expect(content).toHaveAttribute("id", "content-1");
  });

  it("has correct styling classes", () => {
    render(
      <Card>
        <CardContent data-testid="content-test">Styled content</CardContent>
      </Card>,
    );
    const content = screen.getByTestId("content-test");
    expect(content).toHaveClass("px-4");
  });

  it("renders children correctly", () => {
    render(
      <Card>
        <CardContent>
          <p>Paragraph content</p>
        </CardContent>
      </Card>,
    );
    expect(screen.getByText("Paragraph content")).toBeInTheDocument();
  });

  it("renders multiple child elements", () => {
    render(
      <Card>
        <CardContent>
          <span>First</span>
          <span>Second</span>
        </CardContent>
      </Card>,
    );
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });
});
