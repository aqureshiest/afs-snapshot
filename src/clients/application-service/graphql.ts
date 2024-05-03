export const META_FRAGMENT = `
fragment ApplicantFragment on Application {
  id
  createdAt
  href
  relationship
  ssnTokenURI
  lendingDecisionID
  monolithLoanID
  monolithApplicationID
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
      type
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
      monolithFinancialAccountID
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
      opeid
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
    amount {
      requested
      approved
      certified
    }
    asset {
      type
      amount
    }
  }
  cognitoID
  monolithUserID
  monolithLoanID
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
  lendingDecisionID
  product
  brand
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
query Application($id: String!, $root: Boolean = false) {
  application(id: $id, root: $root) {
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

export const ADD_REFERENCE_MUTATION = `
  mutation addReferences($id: UUID!, $references: [ReferenceInput], $meta: EventMeta) {
    addReferences(id: $id, references: $references, meta: $meta) {
      error
    }
  }
`;

export const NEAS_APPLICATION_QUERY = `
  query Application($id: UUID!) {
    application(id: $id) {
      authID
      details {
        email
      }
    }
  }
`;
