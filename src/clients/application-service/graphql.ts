export const META_FRAGMENT = `
fragment ApplicantFragment on Application {
  id
  createdAt
  relationship
  ssn
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