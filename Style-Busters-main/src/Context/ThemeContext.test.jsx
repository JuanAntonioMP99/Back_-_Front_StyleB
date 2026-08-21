import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "./ThemeContext";

const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;

describe("ThemeContext", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it("por defecto es modo claro y fija data-theme=light", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.isDarkMode).toBe(false);
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("inicializa en oscuro si localStorage tiene 'dark'", () => {
    localStorage.setItem("theme", "dark");
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.isDarkMode).toBe(true);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("toggleTheme alterna el modo y lo persiste", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.toggleTheme());
    expect(result.current.isDarkMode).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");

    act(() => result.current.toggleTheme());
    expect(result.current.isDarkMode).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("useTheme fuera del provider lanza error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useTheme())).toThrow(
      /useTheme debe usarse dentro/i,
    );
    spy.mockRestore();
  });
});
