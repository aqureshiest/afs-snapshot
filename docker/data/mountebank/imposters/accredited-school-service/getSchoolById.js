function getSchoolById(request, state) {
  return {
    statusCode: 200,
    body: {
      id: 1777,
      opeid8: "00732978",
      name: "ITT Technical Institute - Corona",
      address: "4160 Temescal Canyon Road",
      forProfit: true,
      accreditations: [
        {
          window: {
            begins: "20120101",
            ends: "20180101",
          },
          agency: "Earnest",
        },
      ],
      cdrs: [],
      rankings: [],
      legacy: true,
      state: "CA",
      city: "Corona",
      zipCode: "928834625",
      programLength: 8,
      schoolType: 3,
      ipedsId: null,
      country: "USA",
      costOfAttendance: null,
      loanTypes: ["slr"],
      duplicateOf: null,
    },
  };
}
