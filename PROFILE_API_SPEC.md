# Agent Profile API Spec

This frontend now calls:

- `GET /api/agents/:agentId/profile`
- `POST /api/agents/:agentId/profile`

## Expected PATCH Payload

```json
{
  "personal": {
    "businessPhone": "+1 (555) 000-0001",
    "emergencyContactPhone": "+1 (555) 000-0002",
    "businessAddress": "123 Financial Ave",
    "city": "Toronto",
    "postalCode": "M5V 2L1",
    "residence": "Owned",
    "married": true,
    "spouseName": "John Doe",
    "spouseDob": "1989-10-12",
    "spouseEmail": "john@example.com",
    "hasChildren": true,
    "children": [
      { "name": "Ava", "age": 8, "gender": "Female" }
    ]
  },
  "professional": {
    "bio": "Experienced ...",
    "yearsOfExperience": 6,
    "licenceDetails": "A4-3226..."
  },
  "business": {
    "consent": true,
    "socials": {
      "linkedin": "",
      "instagram": "",
      "facebook": "",
      "twitter": "",
      "youtube": "",
      "website": ""
    }
  },
  "relationships": {
    "spouse": {
      "name": "John Doe",
      "dob": "1989-10-12",
      "email": "john@example.com"
    },
    "children": [
      { "name": "Ava", "age": 8, "gender": "Female" }
    ]
  }
}
```

## SQL Design (Recommended)

### 1) Agent profile table (1:1)

```sql
CREATE TABLE agent_profiles (
  id BIGSERIAL PRIMARY KEY,
  agent_id BIGINT NOT NULL UNIQUE REFERENCES agents(id) ON DELETE CASCADE,

  business_phone VARCHAR(30),
  emergency_contact_phone VARCHAR(30),
  business_address TEXT,
  city VARCHAR(120),
  postal_code VARCHAR(20),
  residence VARCHAR(30),

  married BOOLEAN DEFAULT FALSE,
  has_children BOOLEAN DEFAULT FALSE,
  spouse_name VARCHAR(120),
  spouse_dob DATE,
  spouse_email VARCHAR(255),

  bio TEXT,
  years_of_experience INT,
  licence_details TEXT,

  business_consent BOOLEAN DEFAULT FALSE,
  socials JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2) Optional relationship table (normalized children/spouse)

Use this when you want structured family records instead of JSON-only.

```sql
CREATE TABLE agent_relationships (
  id BIGSERIAL PRIMARY KEY,
  agent_id BIGINT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  relationship_type VARCHAR(20) NOT NULL, -- SPOUSE, CHILD
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255),
  dob DATE,
  age INT,
  gender VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_relationships_agent_id ON agent_relationships(agent_id);
```

## API Behavior

- `GET /agents/:agentId/profile`
  - Returns `{ profile: { personal, professional, business } }`
- `POST /agents/:agentId/profile`
  - Upsert into `agent_profiles`
  - If using `agent_relationships` table:
    - delete existing spouse/children for agent
    - insert spouse row (if married + spouse exists)
    - insert all child rows from payload
  - Return updated profile

## Validation Rules (minimum)

- `yearsOfExperience >= 0`
- child `age >= 0`
- email fields must be valid emails
