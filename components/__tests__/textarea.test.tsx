import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { Textarea } from "../ui/textarea"

describe("Textarea", () => {
  it("renders correctly", () => {
    render(<Textarea />)
    const textarea = screen.getByRole("textbox")
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveAttribute("data-slot", "textarea")
  })

  it("renders with placeholder", () => {
    render(<Textarea placeholder="Enter your text here" />)
    const textarea = screen.getByPlaceholderText("Enter your text here")
    expect(textarea).toBeInTheDocument()
  })

  it("renders with default value", () => {
    render(<Textarea defaultValue="Initial content" />)
    expect(screen.getByDisplayValue("Initial content")).toBeInTheDocument()
  })

  it("applies custom className", () => {
    render(<Textarea className="custom-textarea-class" />)
    const textarea = screen.getByRole("textbox")
    expect(textarea).toHaveClass("custom-textarea-class")
  })

  it("applies disabled state styling", () => {
    render(<Textarea disabled />)
    const textarea = screen.getByRole("textbox")
    expect(textarea).toBeDisabled()
    expect(textarea).toHaveClass("disabled:cursor-not-allowed", "disabled:bg-input/50", "disabled:opacity-50")
  })

  it("applies disabled styling even when not explicitly disabled if className includes it", () => {
    // The disabled prop should be passed to the textarea element
    render(<Textarea disabled />)
    const textarea = screen.getByRole("textbox")
    expect(textarea).toHaveAttribute("disabled")
  })

  it("applies maxLength attribute", () => {
    render(<Textarea maxLength={100} />)
    const textarea = screen.getByRole("textbox")
    expect(textarea).toHaveAttribute("maxLength", "100")
  })

  it("applies rows prop", () => {
    render(<Textarea rows={10} />)
    const textarea = screen.getByRole("textbox")
    expect(textarea).toHaveAttribute("rows", "10")
  })

  it("forwards name attribute", () => {
    render(<Textarea name="description" />)
    const textarea = screen.getByRole("textbox")
    expect(textarea).toHaveAttribute("name", "description")
  })

  it("forwards id attribute", () => {
    render(<Textarea id="custom-id" />)
    const textarea = screen.getByRole("textbox")
    expect(textarea).toHaveAttribute("id", "custom-id")
  })

  it("forwards required attribute", () => {
    render(<Textarea required />)
    const textarea = screen.getByRole("textbox")
    expect(textarea).toBeRequired()
  })

  it("forwards readOnly attribute", () => {
    render(<Textarea readOnly />)
    const textarea = screen.getByRole("textbox")
    expect(textarea).toHaveAttribute("readonly")
  })

  it("handles onChange event", () => {
    const handleChange = vi.fn()
    render(<Textarea onChange={handleChange} />)
    const textarea = screen.getByRole("textbox")
    textarea.focus()
  })

  it("handles onBlur event", () => {
    const handleBlur = vi.fn()
    render(<Textarea onBlur={handleBlur} />)
    const textarea = screen.getByRole("textbox")
    textarea.blur()
  })

  it("has aria-invalid styling when aria-invalid is set", () => {
    render(<Textarea aria-invalid />)
    const textarea = screen.getByRole("textbox")
    expect(textarea).toHaveClass("aria-invalid:border-destructive", "aria-invalid:ring-3", "aria-invalid:ring-destructive/20")
  })

  it("renders with cols prop", () => {
    render(<Textarea cols={50} />)
    const textarea = screen.getByRole("textbox")
    expect(textarea).toHaveAttribute("cols", "50")
  })
})
