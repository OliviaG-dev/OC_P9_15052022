/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import userEvent from "@testing-library/user-event";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore) // Pour erreur 404 / 500

describe("Given I'm connected as an employee", () => {

  describe("When I'm on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon.className).toBe("active-icon"); // here add expect miss
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });

  describe("When I'm on Bills page and it's loading", () => {
    test("Then Loading page should be displayed", () => {
      const html = BillsUI({ data : bills, loading: true});
      document.body.innerHTML = html;
      const isLoading = screen.getAllByText("Loading...");
      expect(isLoading).toBeTruthy();
    })
  })

  describe("When I'm on Bills page whith an error", () => {
    test("Then error page should be displayed", () => {
      const html = BillsUI({ data : bills, error: true});
      document.body.innerHTML = html;
      const isError = screen.getAllByText("Erreur");
      expect(isError).toBeTruthy();
    })
  })

  describe("When I click on Nouvelle note de frais", () => {
    test("Then I should have the new bill page", () => {
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const html = BillsUI({ data: [] });
      document.body.innerHTML = html;

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const bills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleClickNewBill = jest.fn(() => bills.handleClickNewBill);
      const newBillBtn = screen.getByTestId("btn-new-bill");

      newBillBtn.addEventListener("click", handleClickNewBill);
      userEvent.click(newBillBtn);

      expect(handleClickNewBill).toHaveBeenCalled();
      expect(screen.queryByText("Envoyer une note de frais")).toBeTruthy();
    });
  });

  describe("When I on the icon eye from a bill", () => {
    test("Then a modal should open", () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const html = BillsUI({ data: [bills[1]] });
      document.body.innerHTML = html

      const billsContainer = new Bills ({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })

      const modale = document.getElementById("modaleFile");

      $.fn.modal = jest.fn(() => modale.classList.add("show"));

      const iconEye = screen.getByTestId("icon-eye");
      const handleShowModal = jest.fn(() => billsContainer.handleClickIconEye);

      iconEye.addEventListener("click", handleShowModal);
      userEvent.click(iconEye);
      
      expect(handleShowModal).toHaveBeenCalled();
      expect(modale.classList).toContain("show");
    });
  })

  //Test Integration GET

  describe("When I'm in the Bills Page", () => {
    test("fetch bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a"
        })
      );
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()

      window.onNavigate(ROUTES_PATH.Bills)
      expect(await waitFor(() => screen.getByText("Mes notes de frais"))).toBeTruthy()
    })
  });

  describe("When it the succeeds", () => {
    test("Then it should return an array with the corresponding length", async() => {
      const bills = new Bills({
        document,
        onNavigate,
        store : mockStore,
        localStorage: window.localStorage,
      })
      
      const getBills = jest.fn(() => bills.getBills())
      const list = await getBills()
    
      expect(getBills).toHaveBeenCalled();
      expect(list.length).toBe(4);
    })
  })
  
  describe("When an error occurs", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
        window,
        "localStrorage",
        {value: localStorageMock}
      )
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee",
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })

    test("fetches bills from an API and fails with 404 message error", async () => { 
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"))
          }
        }
      })

      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick)
      const message = await waitFor(() => screen.getByText(/Erreur 404/))
      expect(message).toBeTruthy
    })

    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () => {
            return Promise.reject(new Error("Erreur 500"))
          }
        }
      })
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick)
      const message = await waitFor(() => screen.getByText(/Erreur 500/))
      expect(message).toBeTruthy
    })
  });
});
