# Notion-like Forms System

## Overview
Implement a flexible forms system similar to Notion forms, allowing Super Agents to create customizable forms with various field types, conditional logic, and database integration. Forms can be shared via links and responses can be collected and analyzed.

## Tasks

### Form Builder Interface
- [ ] Create drag-and-drop form builder UI
- [ ] Implement form title, description, and settings
- [ ] Add form preview functionality

### Form Field Types
- [ ] Implement basic field types:
```typescript
// Field type definitions
type FieldType = 
  | 'short_text'      // Single line text input
  | 'long_text'       // Multi-line text area
  | 'number'          // Numeric input with optional min/max
  | 'email'           // Email address with validation
  | 'phone'           // Phone number with formatting
  | 'url'             // Website URL with validation
  | 'single_select'   // Radio buttons or dropdown
  | 'multi_select'    // Checkboxes or multi-select dropdown
  | 'date'            // Date picker
  | 'time'            // Time picker
  | 'date_time'       // Combined date and time
  | 'file_upload'     // File attachment
  | 'image_upload'    // Image upload with preview
  | 'rating'          // Star/number rating
  | 'slider'          // Range slider
  | 'boolean'         // Yes/No or True/False toggle
  | 'signature'       // Digital signature pad
  | 'section_break'   // Visual separator with optional title
  | 'rich_text'       // Formatted text block (non-input)
  | 'matrix'          // Grid of radio buttons/checkboxes
  | 'address'         // Structured address fields
  | 'calculation'     // Formula-based calculated field
  | 'hidden'          // Hidden field for internal use

// Base field interface
interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  helpText?: string;
  placeholder?: string;
  position: number;
  conditionalLogic?: ConditionalLogic;
  validation?: ValidationRules;
}

// Field-specific properties
interface TextFieldProps {
  minLength?: number;
  maxLength?: number;
  defaultValue?: string;
}

interface NumberFieldProps {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
}

interface SelectFieldProps {
  options: Array<{label: string; value: string}>;
  defaultValue?: string | string[];
  allowOther?: boolean;
}

interface FileUploadProps {
  maxSize?: number; // in bytes
  allowedTypes?: string[]; // MIME types
  maxFiles?: number;
}

interface ConditionalLogic {
  action: 'show' | 'hide';
  logicType: 'all' | 'any'; // all = AND, any = OR
  rules: Array<{
    fieldId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
    value: any;
  }>;
}

interface ValidationRules {
  pattern?: string; // regex pattern
  customMessage?: string;
  customValidator?: (value: any) => boolean | string;
}
```
- [ ] Add advanced field types (file upload, date picker, etc.)
- [ ] Create conditional logic for fields (show/hide based on other fields)
- [ ] Add field validation options

### Form Database Integration
- [ ] Create database schema for forms and responses:
```sql
-- Forms table to store form definitions
CREATE TABLE IF NOT EXISTS forms (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by VARCHAR(255) NOT NULL REFERENCES users(id),
    is_public BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settings JSONB NOT NULL DEFAULT '{}'
);

-- Form fields table to store field definitions
CREATE TABLE IF NOT EXISTS form_fields (
    id VARCHAR(255) PRIMARY KEY,
    form_id VARCHAR(255) NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    placeholder TEXT,
    required BOOLEAN DEFAULT FALSE,
    options JSONB,
    position INTEGER NOT NULL,
    conditional_logic JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Form responses table to store submissions
CREATE TABLE IF NOT EXISTS form_responses (
    id VARCHAR(255) PRIMARY KEY,
    form_id VARCHAR(255) NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    respondent_id VARCHAR(255) REFERENCES users(id),
    respondent_email VARCHAR(255),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent TEXT
);

-- Form field responses to store individual field values
CREATE TABLE IF NOT EXISTS form_field_responses (
    id SERIAL PRIMARY KEY,
    response_id VARCHAR(255) NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE,
    field_id VARCHAR(255) NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
    value TEXT,
    file_url TEXT
);
```
- [ ] Implement form submission storage
- [ ] Create form response retrieval API
- [ ] Add form analytics (completion rate, average time)

### Form Sharing System
- [ ] Generate shareable links for forms
- [ ] Create public/private visibility options
- [ ] Implement expiration dates for forms
- [ ] Add password protection option
- [ ] Implementation example:
```typescript
// Form sharing component
const FormSharing = ({ formId }: { formId: string }) => {
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    isPublic: false,
    password: '',
    expiresAt: null,
    allowEmbedding: false,
  });
  
  const [shareUrl, setShareUrl] = useState<string>('');
  const [embedCode, setEmbedCode] = useState<string>('');
  
  // Generate or update share link
  const generateShareLink = async () => {
    try {
      const response = await fetch(`/api/forms/${formId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shareSettings),
      });
      
      const data = await response.json();
      setShareUrl(data.shareUrl);
      
      if (shareSettings.allowEmbedding) {
        setEmbedCode(`<iframe src="${data.embedUrl}" width="100%" height="600" frameborder="0"></iframe>`);
      }
    } catch (error) {
      console.error('Failed to generate share link:', error);
    }
  };
  
  // Update share settings
  const updateShareSettings = async () => {
    try {
      await fetch(`/api/forms/${formId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sharing: shareSettings }),
      });
      
      generateShareLink();
    } catch (error) {
      console.error('Failed to update share settings:', error);
    }
  };
  
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-medium mb-4">Share Form</h3>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <Switch
            checked={shareSettings.isPublic}
            onCheckedChange={(checked) => {
              setShareSettings(prev => ({ ...prev, isPublic: checked }));
            }}
          />
          <Label className="ml-2">Make form public</Label>
        </div>
        
        {shareSettings.isPublic && (
          <>
            <div className="space-y-2">
              <Label>Password Protection (Optional)</Label>
              <Input
                type="password"
                placeholder="Leave blank for no password"
                value={shareSettings.password}
                onChange={(e) => {
                  setShareSettings(prev => ({ ...prev, password: e.target.value }));
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Expiration Date (Optional)</Label>
              <DatePicker
                selected={shareSettings.expiresAt}
                onChange={(date) => {
                  setShareSettings(prev => ({ ...prev, expiresAt: date }));
                }}
                placeholderText="Never expires"
                minDate={new Date()}
              />
            </div>
            
            <div className="flex items-center">
              <Switch
                checked={shareSettings.allowEmbedding}
                onCheckedChange={(checked) => {
                  setShareSettings(prev => ({ ...prev, allowEmbedding: checked }));
                }}
              />
              <Label className="ml-2">Allow embedding</Label>
            </div>
            
            <Button onClick={updateShareSettings}>Update Sharing Settings</Button>
            
            {shareUrl && (
              <div className="mt-4 space-y-2">
                <Label>Share URL</Label>
                <div className="flex">
                  <Input value={shareUrl} readOnly />
                  <Button
                    className="ml-2"
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}
            
            {shareSettings.allowEmbedding && embedCode && (
              <div className="mt-4 space-y-2">
                <Label>Embed Code</Label>
                <div className="flex">
                  <Textarea value={embedCode} readOnly />
                  <Button
                    className="ml-2"
                    onClick={() => navigator.clipboard.writeText(embedCode)}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
```

### Form Response Views
- [ ] Table view of all responses
- [ ] Individual response detailed view
- [ ] Response filtering and sorting
- [ ] Export responses to CSV/Excel
- [ ] Response statistics and visualizations
- [ ] Implementation example:
```typescript
// Form responses dashboard component
const FormResponsesDashboard = ({ formId }: { formId: string }) => {
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<ResponseStats>({
    total: 0,
    completion_rate: 0,
    avg_completion_time: 0,
  });
  const [filters, setFilters] = useState<ResponseFilters>({
    dateRange: null,
    completionStatus: 'all',
    searchTerm: '',
  });
  
  // Fetch responses with filters
  const fetchResponses = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.dateRange?.from) {
        queryParams.append('from', filters.dateRange.from.toISOString());
      }
      if (filters.dateRange?.to) {
        queryParams.append('to', filters.dateRange.to.toISOString());
      }
      if (filters.completionStatus !== 'all') {
        queryParams.append('status', filters.completionStatus);
      }
      if (filters.searchTerm) {
        queryParams.append('search', filters.searchTerm);
      }
      
      const response = await fetch(`/api/forms/${formId}/responses?${queryParams}`);
      const data = await response.json();
      
      setResponses(data.responses);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch responses:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Export responses
  const exportResponses = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/forms/${formId}/responses/export?format=${format}`);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `form-responses-${formId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Failed to export responses as ${format}:`, error);
    }
  };
  
  // Load responses on mount and when filters change
  useEffect(() => {
    fetchResponses();
  }, [filters]);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Form Responses</h2>
        
        <div className="flex space-x-2">
          <Button onClick={() => exportResponses('csv')}>
            Export CSV
          </Button>
          <Button onClick={() => exportResponses('pdf')}>
            Export PDF
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.completion_rate}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Avg. Completion Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatTime(stats.avg_completion_time)}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex space-x-4 mb-4">
        <Input
          placeholder="Search responses..."
          value={filters.searchTerm}
          onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
          className="max-w-xs"
        />
        
        <Select
          value={filters.completionStatus}
          onValueChange={(value) => setFilters(prev => ({ ...prev, completionStatus: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Responses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
          </SelectContent>
        </Select>
        
        <DateRangePicker
          value={filters.dateRange}
          onChange={(range) => setFilters(prev => ({ ...prev, dateRange: range }))}
        />
      </div>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Respondent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Time Taken</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {responses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No responses found
                </TableCell>
              </TableRow>
            ) : (
              responses.map((response) => (
                <TableRow key={response.id}>
                  <TableCell>
                    {response.respondent_email || 'Anonymous'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={response.completed_at ? 'success' : 'warning'}>
                      {response.completed_at ? 'Completed' : 'Partial'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(response.started_at)}</TableCell>
                  <TableCell>
                    {response.completed_at ? formatDate(response.completed_at) : '-'}
                  </TableCell>
                  <TableCell>
                    {response.completed_at
                      ? formatTimeDiff(response.started_at, response.completed_at)
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/forms/${formId}/responses/${response.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
```

### Form Management
- [ ] Form duplication functionality
- [ ] Form archiving system
- [ ] Form version history
- [ ] Form templates library

### Advanced Form Features
- [ ] Form logic and branching (skip questions based on answers)
- [ ] Form sections and pagination
- [ ] Progress indicators
- [ ] Save and continue later functionality
- [ ] Confirmation emails to respondents
- [ ] Notifications for new submissions

### API Endpoints Implementation
```typescript
// src/lib/actions.ts - Form API endpoints

// Create a new form
export async function createForm(formData: FormCreationData) {
  const { title, description, created_by, settings = {} } = formData;
  const formId = `form_${Date.now()}`;
  
  await sql`
    INSERT INTO forms (id, title, description, created_by, settings)
    VALUES (${formId}, ${title}, ${description}, ${created_by}, ${JSON.stringify(settings)})
  `;
  
  return { formId };
}

// Get all forms for a user
export async function getForms(userId: string) {
  const forms = await sql<FormSummary[]>`
    SELECT id, title, description, created_at, updated_at, 
           (SELECT COUNT(*) FROM form_responses WHERE form_id = forms.id) as response_count
    FROM forms
    WHERE created_by = ${userId}
    ORDER BY updated_at DESC
  `;
  
  return forms;
}

// Get a single form with all fields
export async function getForm(formId: string) {
  const [form] = await sql<FormWithFields[]>`
    SELECT f.*, json_agg(
      json_build_object(
        'id', ff.id,
        'type', ff.type,
        'label', ff.label,
        'placeholder', ff.placeholder,
        'required', ff.required,
        'options', ff.options,
        'position', ff.position,
        'conditional_logic', ff.conditional_logic
      ) ORDER BY ff.position
    ) as fields
    FROM forms f
    LEFT JOIN form_fields ff ON f.id = ff.form_id
    WHERE f.id = ${formId}
    GROUP BY f.id
  `;
  
  return form;
}

// Update form details
export async function updateForm(formId: string, updates: Partial<FormUpdateData>) {
  const { title, description, settings } = updates;
  
  await sql`
    UPDATE forms
    SET 
      title = COALESCE(${title}, title),
      description = COALESCE(${description}, description),
      settings = COALESCE(${settings ? JSON.stringify(settings) : null}, settings),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${formId}
  `;
  
  return { success: true };
}

// Add a field to a form
export async function addFormField(formId: string, fieldData: FormFieldCreationData) {
  const { type, label, placeholder, required, options, position, conditional_logic } = fieldData;
  const fieldId = `field_${Date.now()}`;
  
  await sql`
    INSERT INTO form_fields (
      id, form_id, type, label, placeholder, required, options, position, conditional_logic
    ) VALUES (
      ${fieldId}, ${formId}, ${type}, ${label}, ${placeholder}, ${required}, 
      ${options ? JSON.stringify(options) : null},
      ${position},
      ${conditional_logic ? JSON.stringify(conditional_logic) : null}
    )
  `;
  
  return { fieldId };
}

// Update a form field
export async function updateFormField(fieldId: string, updates: Partial<FormFieldUpdateData>) {
  const { label, placeholder, required, options, position, conditional_logic } = updates;
  
  await sql`
    UPDATE form_fields
    SET 
      label = COALESCE(${label}, label),
      placeholder = COALESCE(${placeholder}, placeholder),
      required = COALESCE(${required}, required),
      options = COALESCE(${options ? JSON.stringify(options) : null}, options),
      position = COALESCE(${position}, position),
      conditional_logic = COALESCE(${conditional_logic ? JSON.stringify(conditional_logic) : null}, conditional_logic),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${fieldId}
  `;
  
  return { success: true };
}

// Delete a form field
export async function deleteFormField(fieldId: string) {
  await sql`DELETE FROM form_fields WHERE id = ${fieldId}`;
  return { success: true };
}

// Submit a form response
export async function submitFormResponse(responseData: FormResponseSubmission) {
  const { form_id, respondent_id, respondent_email, field_responses, completed } = responseData;
  const responseId = `response_${Date.now()}`;
  
  // Begin transaction
  await sql.begin(async (sql) => {
    // Create the response record
    await sql`
      INSERT INTO form_responses (
        id, form_id, respondent_id, respondent_email, 
        completed_at
      ) VALUES (
        ${responseId}, ${form_id}, ${respondent_id}, ${respondent_email},
        ${completed ? sql`CURRENT_TIMESTAMP` : null}
      )
    `;
    
    // Insert all field responses
    for (const fieldResponse of field_responses) {
      await sql`
        INSERT INTO form_field_responses (
          response_id, field_id, value, file_url
        ) VALUES (
          ${responseId}, ${fieldResponse.field_id}, 
          ${fieldResponse.value}, ${fieldResponse.file_url}
        )
      `;
    }
  });
  
  return { responseId };
}

// Get form responses
export async function getFormResponses(formId: string, filters: ResponseFilters = {}) {
  const { from, to, status, search } = filters;
  
  let query = sql`
    SELECT r.*, 
      (SELECT COUNT(*) FROM form_field_responses WHERE response_id = r.id) as field_count
    FROM form_responses r
    WHERE r.form_id = ${formId}
  `;
  
  if (from) {
    query = sql`${query} AND r.started_at >= ${from}`;
  }
  
  if (to) {
    query = sql`${query} AND r.started_at <= ${to}`;
  }
  
  if (status === 'completed') {
    query = sql`${query} AND r.completed_at IS NOT NULL`;
  } else if (status === 'partial') {
    query = sql`${query} AND r.completed_at IS NULL`;
  }
  
  if (search) {
    query = sql`${query} AND r.respondent_email ILIKE ${`%${search}%`}`;
  }
  
  query = sql`${query} ORDER BY r.started_at DESC`;
  
  const responses = await query;
  
  // Get response stats
  const [stats] = await sql`
    SELECT 
      COUNT(*) as total,
      ROUND(AVG(CASE WHEN completed_at IS NOT NULL THEN 100 ELSE 0 END), 1) as completion_rate,
      AVG(
        CASE 
          WHEN completed_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (completed_at - started_at)) 
          ELSE NULL 
        END
      ) as avg_completion_time
    FROM form_responses
    WHERE form_id = ${formId}
  `;
  
  return { responses, stats };
}

// Get a single form response with all field values
export async function getFormResponse(responseId: string) {
  const [response] = await sql`
    SELECT r.*, json_agg(
      json_build_object(
        'field_id', ffr.field_id,
        'value', ffr.value,
        'file_url', ffr.file_url,
        'field_type', ff.type,
        'field_label', ff.label
      )
    ) as field_responses
    FROM form_responses r
    JOIN form_field_responses ffr ON r.id = ffr.response_id
    JOIN form_fields ff ON ffr.field_id = ff.id
    WHERE r.id = ${responseId}
    GROUP BY r.id
  `;
  
  return response;
}
```

## Recommended Libraries

1. **React Hook Form**
   - Performant, flexible and extensible forms with easy validation
   - Perfect for both form builder and form submission interfaces
   - Supports complex validation rules and conditional fields
   - GitHub: react-hook-form/react-hook-form

2. **Zod**
   - TypeScript-first schema validation with static type inference
   - Ideal for form validation and ensuring data integrity
   - Can generate TypeScript types from schemas
   - GitHub: colinhacks/zod

3. **DraftJS or TipTap**
   - Rich text editing capabilities for long-form questions and answers
   - Customizable toolbar and formatting options
   - GitHub: facebook/draft-js or ueberdosis/tiptap

4. **React Beautiful DnD**
   - Beautiful and accessible drag and drop for lists
   - Perfect for reordering form fields in the form builder
   - GitHub: atlassian/react-beautiful-dnd

## Implementation Strategy

1. Begin with database schema design for forms and responses
2. Create basic form builder UI with essential field types
3. Implement form submission and response storage
4. Add form sharing functionality
5. Develop response viewing interfaces
6. Add advanced features incrementally