import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Button } from "../src";

describe("ui components", () => {
  it("renders Button", () => {
    const { getByRole } = render(<Button>Click</Button>);
    expect(getByRole("button").textContent).toBe("Click");
  });
});
