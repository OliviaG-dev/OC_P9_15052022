/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import mockStore from "../__mocks__/store";
import NewBillUI from "../views/NewBillUI.js";


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlighted", async() => {
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
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("icon-mail"));
      const mailIcon = screen.getByTestId("icon-mail");
      const iconActif = mailIcon.classList.contains("active-icon")
      expect(iconActif).toBeTruthy();
    })
  })

    test("Then the new bill's form should be loaded with its fields", () => {
      const html = NewBillUI;
      document.body.innerHTML = html
      
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      expect(screen.getByTestId("expense-type")).toBeTruthy();
      expect(screen.getByTestId("expense-name")).toBeTruthy();
      expect(screen.getByTestId("datepicker")).toBeTruthy();
      expect(screen.getByTestId("amount")).toBeTruthy();
      expect(screen.getByTestId("vat")).toBeTruthy();
      expect(screen.getByTestId("pct")).toBeTruthy();
      expect(screen.getByTestId("commentary")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();
      expect(screen.getByRole("button")).toBeTruthy();
    })
  

  describe("When I add an image file", () => {

    test("Then this new file should appear in the field justificatif", () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const onNavigate = (pathname) => { 
        document.body.innerHTML = ROUTES({ pathname }) 
      };

      const html = NewBillUI();
      document.body.innerHTML = html

      const newBills = new NewBill ({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(newBills.handleChangeFile);
      const inputFile = screen.getByTestId("file");

      inputFile.addEventListener("change", handleChangeFile);
      fireEvent.change(inputFile, {
        target: {
          files: [new File(["file.png"], "file.png", { type: "file/png" })]
        }
      });

      expect(handleChangeFile).toHaveBeenCalled();
      expect(inputFile.files[0].name).toBe("file.png")
    });

    test("When I add a wrong format of file", () => {

      const html = NewBillUI();
      document.body.innerHTML = html

      const onNavigate = (pathname) => {
        document.body.innerHTML = pathname;
      };

      const newBills = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(newBills.handleChangeFile);
      const inputFile = screen.getByTestId("file");
      
      inputFile.addEventListener("change", handleChangeFile);
      fireEvent.change(inputFile, {
        target: {
          files: [new File(["file.css"], "file.css", { type: "file/css" })]
        }
      });

      expect(handleChangeFile).toHaveBeenCalled()
      expect(inputFile.files[0].name).not.toBe("file.png");
    });
  })
})

// Test d'integration POST

describe("Given I am a user connected as employee", () => {
  describe("When I send a new Bill", () => {
    test("Then the bill is created", async() => {
      const html = NewBillUI();
      document.body.innerHTML = html

      const onNavigate = (pathname) => {
        document.body.innerHTML = pathname;
      };

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });

      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );

      const newBills = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const validBill = {
        type: "Restaurants et bars",
        name: "Restaurant",
        date: "2221-02-22",
        amount: 60,
        vat: 10,
        pct: 20, 
        commentary: "business meal",
        fileUrl: "../img/0.jpg",
        fileName: "test.jpg",
        status: "pending",
      }

      screen.getByTestId("expense-type").value = validBill.type;
      screen.getByTestId("expense-name").value = validBill.name;
      screen.getByTestId("datepicker").value = validBill.date;
      screen.getByTestId("amount").value = validBill.amount;
      screen.getByTestId("vat").value = validBill.vat;
      screen.getByTestId("pct").value = validBill.pct;
      screen.getByTestId("commentary").value = validBill.commentary;

      newBills.fileName = validBill.fileName
      newBills.fileUrl = validBill.fileUrl;

      newBills.updateBill = jest.fn()
      const handleSubmit = jest.fn(() => newBills.handleSubmit)

      const form = screen.getByTestId("form-new-bill")
      form.addEventListener("submit", handleSubmit)
      fireEvent.submit(form)
      
      expect(handleSubmit).toHaveBeenCalled()
      expect(newBills.updateBill).toHaveBeenCalled()
    });


  })
})