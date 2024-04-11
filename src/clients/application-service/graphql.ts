export const META_FRAGMENT = `
fragment ApplicantFragment on Application {
  id
  createdAt
  relationship
  relationships {
    id
    relationship
  }
  details {
    name {
      first
      last
    }
    dateOfBirth
    email
    location {
      street1
      street2
      city
      state
      zip
      citizenship
    }
    phone {
      type
      number
    }
    financialAccounts {
      index
      name
      type
      selected
      account_last4
      institution_name
      monolith_id
      balance
      plaidItemID
      plaidAccessToken
    }
    education {
      degree
      enrollment
      graduationDate
      termStart
      termEnd
      credits
    }
    income {
      amount
      type
      employer
      name
      title
      start
      end
    }
  }
  cognitoID
}

fragment ApplicationFragment on Application {
  id
  details {
    amount {
      requested
      approved
      certified
    }
  }
  product
}

fragment MetaFragment on Application {
  ...ApplicationFragment
  ...ApplicantFragment
  tags
  status {
    name
    asOf
  }
  root {
    ...ApplicantFragment
  }
  cosigner {
    ...ApplicantFragment
  }
  primary {
    ...ApplicantFragment
  }
  applicants {
    ...ApplicantFragment
  }
}
`;

/**
 * TODO: use introspection or generate this query using the known properties
 * required by the manifest
 */
export const TEMP_DEFAULT_APPLICATION_QUERY = `
${META_FRAGMENT}
query Application($id: String!) {
  application(id: $id) {
    ...MetaFragment
  }
}
`;

export const TEMP_DEFAULT_APPLICATIONS_QUERY = `
${META_FRAGMENT}
query Applications($criteria: [ApplicationSearchCriteria]!) {
  applications(criteria: $criteria) {
    ...MetaFragment
  }
}
`;
