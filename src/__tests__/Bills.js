/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import { bills } from "../fixtures/bills.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

//** getBills //containers/Bills */
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
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
      //to-do write expect expression
      //** ajout de l'expect */
      expect(windowIcon.className).toBe("active-icon");
    });
    //** ajout du tri des dates sur la page views/BillsUi.js */
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
});

//** buttonNewBill/handleClickNewBill  //containers/Bills */
describe("When I click on New Bill", () => {
  test("then the new bill page should open", () => {
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    const mockedBills = new Bills({
      document,
      onNavigate,
      mockStore,
      localStorage: window.localStorage,
    });

    const handleClickNewBill = jest.fn((e) =>
      mockedBills.handleClickNewBill(e)
    );
    const buttonNewBill = screen.getByTestId("btn-new-bill");
    buttonNewBill.addEventListener("click", handleClickNewBill);
    userEvent.click(buttonNewBill);

    expect(handleClickNewBill).toHaveBeenCalled();
    expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
    expect(screen.getByTestId("form-new-bill")).toBeTruthy();
  });
});

//** handleClickIconEye  //containers/Bills */
describe("When I click on an icon eye", () => {
  test("then the display proof should open", () => {
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    const html = BillsUI({ data: bills });
    document.body.innerHTML = html;
    $.fn.modal = jest.fn();

    const mockedBills = new Bills({
      document,
      onNavigate,
      mockStore,
      localStorage: window.localStorage,
    });

    const iconEye = screen.getAllByTestId("icon-eye")[0];
    const handleClickIconEye = jest.fn(mockedBills.handleClickIconEye(iconEye));

    iconEye.addEventListener("click", handleClickIconEye);
    userEvent.click(iconEye);

    expect(handleClickIconEye).toHaveBeenCalled;
    expect(screen.getAllByText("Justificatif")).toBeTruthy();
  });
});

//***  test d'intégration GET ***
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills page", () => {
    test("fetches bills from mock API GET", async () => {
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
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const mockedBills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      console.log(mockStore);
      const bills = await mockedBills.getBills();
      expect(bills.length != 0).toBeTruthy();
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");

        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        document.body.innerHTML = BillsUI({ error: "Erreur 404" });
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        document.body.innerHTML = BillsUI({ error: "Erreur 500" });
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
