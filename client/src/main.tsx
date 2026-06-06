import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App";
import HomePage from "./pages/HomePage";
import NewCareerPage from "./pages/NewCareerPage";
import CareerPage from "./pages/CareerPage";
import RaceResultsPage from "./pages/RaceResultsPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "new", element: <NewCareerPage /> },
      { path: "career/:id", element: <CareerPage /> },
      { path: "career/:id/race/:raceId", element: <RaceResultsPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
