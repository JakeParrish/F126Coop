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
      { path: "career/:slug", element: <CareerPage /> },
      { path: "career/:slug/race/:round", element: <RaceResultsPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
