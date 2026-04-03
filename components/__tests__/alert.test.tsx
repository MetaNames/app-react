import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Alert, AlertDescription } from "../ui/alert"

describe("Alert", () => {
  it("renders with default variant", () => {
    render(<Alert>Default alert content</Alert>)
    const alert = screen.getByRole("alert")
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveAttribute("data-slot", "alert")
    expect(alert).toHaveClass("bg-card", "text-card-foreground")
  })

  it("renders with destructive variant", () => {
    render(<Alert variant="destructive">Destructive alert content</Alert>)
    const alert = screen.getByRole("alert")
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveClass("bg-card", "text-destructive")
  })

  it("applies custom className", () => {
    render(<Alert className="custom-class">Alert with custom class</Alert>)
    const alert = screen.getByRole("alert")
    expect(alert).toHaveClass("custom-class")
  })

  it("forwards additional props to the underlying div", () => {
    render(
      <Alert data-testid="custom-alert" id="alert-1">
        Alert with props
      </Alert>
    )
    const alert = screen.getByTestId("custom-alert")
    expect(alert).toHaveAttribute("id", "alert-1")
  })

  it("renders children correctly", () => {
    render(<Alert>Alert children content</Alert>)
    expect(screen.getByText("Alert children content")).toBeInTheDocument()
  })
})

describe("AlertDescription", () => {
  it("renders correctly", () => {
    render(
      <Alert>
        <AlertDescription>Description content</AlertDescription>
      </Alert>
    )
    const description = screen.getByText("Description content")
    expect(description).toBeInTheDocument()
    expect(description).toHaveAttribute("data-slot", "alert-description")
  })

  it("has correct default styling classes", () => {
    render(
      <Alert>
        <AlertDescription>Test description</AlertDescription>
      </Alert>
    )
    const description = screen.getByText("Test description")
    expect(description).toHaveClass("text-sm", "text-balance", "text-muted-foreground")
  })

  it("applies custom className", () => {
    render(
      <Alert>
        <AlertDescription className="custom-description-class">
          Custom styled description
        </AlertDescription>
      </Alert>
    )
    const description = screen.getByText("Custom styled description")
    expect(description).toHaveClass("custom-description-class")
  })

  it("renders multiple paragraphs correctly", () => {
    render(
      <Alert>
        <AlertDescription>
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </AlertDescription>
      </Alert>
    )
    expect(screen.getByText("First paragraph")).toBeInTheDocument()
    expect(screen.getByText("Second paragraph")).toBeInTheDocument()
  })

  it("forwards additional props", () => {
    render(
      <Alert>
        <AlertDescription data-testid="description-test" id="desc-1">
          Description with props
        </AlertDescription>
      </Alert>
    )
    const description = screen.getByTestId("description-test")
    expect(description).toHaveAttribute("id", "desc-1")
  })
})
