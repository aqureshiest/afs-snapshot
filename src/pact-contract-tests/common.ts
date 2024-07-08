import axios, { AxiosPromise } from "axios";

export async function ldsPostRequest(url: string, body: object): AxiosPromise {
  return axios
    .request({
      baseURL: `${url}`,
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      url: "/v2/decision",
      data: body,
    })
    .then((result) => result)
    .catch((err) => err.response);
}
