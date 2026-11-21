import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import { Layout } from '../componentes/Navbar';
import { EventCatalog } from '../pages/EventCatalog';
import { RutaProtegida } from '../layouts/RutaProtegida';
import { RutaPorRol } from '../layouts/RutaPorRol';
import { SoloAnonimo } from '../layouts/SoloAnonimo';

const EventDetail = lazy(() =>
  import('../pages/EventDetail').then((m) => ({ default: m.EventDetail }))
);
const Login = lazy(() => import('../pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() =>
  import('../pages/Register').then((m) => ({ default: m.Register }))
);

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        index: true,
        element: <EventCatalog />,
      },
      {
        path: 'eventos',
        element: <EventCatalog />,
      },
      {
        path: 'eventos/:eventCode',
        element: <EventDetail />,
      },
      {
        element: <SoloAnonimo />,
        children: [
          {
            path: 'login',
            element: <Login />,
          },
          {
            path: 'registro',
            element: <Register />,
          },
        ],
      },
      {
        element: <RutaProtegida />,
        children: [],
      },
      {
        element: <RutaPorRol roles={['USER']} />,
        children: [],
      },
      {
        element: <RutaPorRol roles={['STAFF', 'ADMIN']} />,
        children: [],
      },
      {
        element: <RutaPorRol roles={['ADMIN']} />,
        children: [],
      },
      {
        path: '403',
        element: <div className="p-8 text-center">No tienes permisos para acceder a esta sección.</div>,
      },
      {
        path: '*',
        element: <div className="p-8 text-center">No encontramos esta página.</div>,
      },
    ],
  },
]);