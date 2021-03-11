const axios = require("axios");
const queryString = require("query-string");

const axiosClient = axios.create({
  headers: {
    "content-type": "application/json",
  },
  timeout: 5000,
  paramsSerializer: (params) => queryString.stringify(params),
});

// Handle request
axiosClient.interceptors.request.use((config) => {
  // ..Handle token
  return config;
});

// Handle response
axiosClient.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data;
    }

    return response;
  },
  (error) => {
    // ..Handle error

    throw error;
  }
);

module.exports = axiosClient;