import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataSourceBadge } from "@/components/ui/Badge";
import { SelectField, TextField } from "@/components/ui/FormControls";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Meter } from "@/components/ui/Meter";

describe("Button", () => {
  it("renders and handles clicks", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("applies variant and custom classes", () => {
    render(
      <Button variant="danger" className="extra">
        Del
      </Button>,
    );
    const btn = screen.getByRole("button", { name: "Del" });
    expect(btn.className).toContain("btn--danger");
    expect(btn.className).toContain("extra");
  });

  it("supports the secondary variant and submit type", () => {
    render(
      <Button variant="secondary" type="submit">
        Save
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
      "type",
      "submit",
    );
  });
});

describe("Card", () => {
  it("renders as the requested element", () => {
    const { container } = render(<Card as="section">content</Card>);
    expect(container.querySelector("section")).toBeInTheDocument();
  });

  it("defaults to a div", () => {
    const { container } = render(<Card>content</Card>);
    expect(container.querySelector("div.card")).toBeInTheDocument();
  });
});

describe("DataSourceBadge", () => {
  it("shows demo and live labels", () => {
    const { rerender } = render(<DataSourceBadge demo />);
    expect(screen.getByText("Demo data")).toBeInTheDocument();
    rerender(<DataSourceBadge demo={false} />);
    expect(screen.getByText("Live data")).toBeInTheDocument();
  });
});

describe("TextField", () => {
  it("renders label, description and connects aria-describedby", () => {
    render(
      <TextField
        id="city"
        label="City"
        description="optional"
        value=""
        onChange={() => {}}
      />,
    );
    const input = screen.getByLabelText("City");
    expect(input).toHaveAttribute("aria-describedby", "city-desc");
  });

  it("links the error message and marks invalid", () => {
    render(
      <TextField
        id="age"
        label="Age"
        error="Required"
        value=""
        onChange={() => {}}
      />,
    );
    const input = screen.getByLabelText("Age");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "age-err");
    expect(screen.getByRole("alert")).toHaveTextContent("Required");
  });

  it("has no aria-describedby when neither description nor error exist", () => {
    render(<TextField id="x" label="X" value="" onChange={() => {}} />);
    expect(screen.getByLabelText("X")).not.toHaveAttribute("aria-describedby");
  });

  it("emits typed values", async () => {
    const onChange = vi.fn();
    render(<TextField id="x" label="X" value="" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("X"), "a");
    expect(onChange).toHaveBeenCalledWith("a");
  });
});

describe("SelectField", () => {
  it("renders options and emits changes", async () => {
    const onChange = vi.fn();
    render(
      <SelectField
        id="diet"
        label="Diet"
        value="a"
        options={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]}
        onChange={onChange}
      />,
    );
    await userEvent.selectOptions(screen.getByLabelText("Diet"), "b");
    expect(onChange).toHaveBeenCalledWith("b");
  });

  it("marks the select invalid when there is an error", () => {
    render(
      <SelectField
        id="diet"
        label="Diet"
        value="a"
        error="Pick one"
        options={[{ value: "a", label: "A" }]}
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText("Diet")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("StatusMessage", () => {
  it("renders an info status", () => {
    render(<StatusMessage message="Saved" />);
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });

  it("renders an error with a warning marker", () => {
    render(<StatusMessage message="Failed" tone="error" />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Failed");
    expect(alert.textContent).toContain("⚠");
  });

  it("omits the marker when an error message is empty", () => {
    render(<StatusMessage message="" tone="error" />);
    expect(screen.getByRole("alert").textContent).not.toContain("⚠");
  });
});

describe("Meter", () => {
  it("exposes accessible progress attributes", () => {
    render(<Meter label="Score" value={50} max={100} />);
    const meter = screen.getByRole("progressbar", { name: "Score" });
    expect(meter).toHaveAttribute("aria-valuenow", "50");
    expect(meter).toHaveAttribute("aria-valuetext", "50 of 100");
  });

  it("uses a provided value text and guards a zero max", () => {
    render(<Meter label="S" value={5} max={0} valueText="5 kg" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuetext",
      "5 kg",
    );
  });
});
