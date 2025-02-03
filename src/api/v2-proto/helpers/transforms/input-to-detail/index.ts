import { inputPhoneToDetail } from "./phone.js";
import { inputNameToDetail } from "./name.js";
import { inputEmailToDetail } from "./email.js";
import { inputDateToDetail } from "./date.js";
import { inputAddressToDetail } from "./address.js";

export const inputToDetail = {
  phone: inputPhoneToDetail,
  name: inputNameToDetail,
  email: inputEmailToDetail,
  date: inputDateToDetail,
  address: inputAddressToDetail,
}