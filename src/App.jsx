import React from "react";
import Dashboard from "./pages/Dashboard";
import Predict from "./pages/Predict";
import Compare from "./pages/Compare";
import SideBar from "./comp/SideBar";
import { ClimateProvider } from "./context/ClimateContext";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<SideBar />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/predict" element={<Predict />} />
      <Route path="/compare" element={<Compare />} />
    </Route>,
  ),
);

const App = () => {
  return (
    <ClimateProvider>
      <RouterProvider router={router} />
    </ClimateProvider>
  );
};

export default App;
