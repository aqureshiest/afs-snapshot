function getSchoolByName(request, state) {
  return {
    statusCode: 200,
    body: {
      schools: [
        {
          id: 2470,
          opeid8: "00131200",
          name: "University of California, Berkeley",
          address: "200 California Hall",
          state: "CA",
          city: "Berkeley",
          country: "USA",
        },
        {
          id: 1526,
          opeid8: "00130500",
          name: "Stanford University",
          address: "1 Stanford University",
          state: "CA",
          city: "Stanford",
          country: "USA",
        },
        {
          id: 1777,
          opeid8: "00732978",
          name: "ITT Technical Institute - Corona",
          address: "4160 Temescal Canyon Road",
          state: "CA",
          city: "Corona",
          country: "USA",
        },
      ],
    },
  };
}
