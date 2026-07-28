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
