import { ApolloProvider } from "@apollo/client";
import client from "./api/client";
import AppRoutes from "./routes/AppRoutes";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  return (
    <ApolloProvider client={client}>
      <div className="App">
        <AppRoutes /> {/* This will render all your routes */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </div>
    </ApolloProvider>
  );
};

export default App;
// Revision note [2026-07-13 18:25:36 +0300]: Improve dark mode CSS variable consistency

// Revision note [2026-07-28 09:38:47 +0300]: Enhance member contribution table filters

// Revision note [2026-08-11 14:43:43 +0300]: Update i18n translations and labels

// Activity update [2026-07-12 19:57:34 +0300]: Improve dark mode CSS variable consistency

// Activity update [2026-07-23 14:13:59 +0300]: Update word of the day dynamic graphics

// Activity update [2026-08-02 18:52:35 +0300]: Improve responsive grid breakpoint spacing

// Activity update [2026-08-11 21:00:19 +0300]: Refactor pending post review modal flow
