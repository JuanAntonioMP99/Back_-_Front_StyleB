import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import ConfirmationPage from "./ConfirmationPage";

vi.mock("../Context/AuthContext", () => ({
  useAuth: () => ({ user: { name: "Ada" } }),
}));

function renderAt(state) {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: "/order-confirmation", state }]}
    >
      <Routes>
        <Route path="/order-confirmation" element={<ConfirmationPage />} />
        <Route path="/" element={<div>HOME</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ConfirmationPage", () => {
  it("con orden en el state muestra la confirmación y el número", () => {
    renderAt({ order: { _id: "o123" } });

    expect(screen.getByTestId("order-success")).toBeVisible();
    expect(screen.getByTestId("order-number")).toHaveTextContent("o123");
    expect(screen.getByText(/gracias por tu compra, ada/i)).toBeInTheDocument();
  });

  it("sin orden redirige al home", () => {
    renderAt(undefined);

    expect(screen.getByText("HOME")).toBeInTheDocument();
    expect(screen.queryByTestId("order-number")).not.toBeInTheDocument();
  });
});
