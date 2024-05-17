export const META_FRAGMENT = `
fragment ApplicantFragment on Application {
  id
  createdAt
  href
  relationship
  partnerDiscountAmount
  tag {
    applicants
    serialization
    status
  }
  monolithUserID
  cognitoID
  reference {
    authID
    brand
    cognitoID
    lender {
      canCapInterest
      id
      loanProgramCode
      maximumLoanAmount
      maxVariableRate
      minimumLoanAmount
      multiLoanRestrictions
      name
      navientLenderId
      promissoryNoteId
    }
    lenderId
    lendingCheckoutID
    lendingDecisionID
    lookupHash
    monolithApplicationID
    monolithLoanID
    monolithUserID
    partnerName
    product
    rateMapTag
    rateMapVersion
    referralProgramId
    ssnTokenURI
  }
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
      plaidAccountID
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
  status {
    name
    asOf
  }
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
  brand
  product
  lendingDecisionID
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
    applicants {
      ...ApplicantFragment
    }
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
