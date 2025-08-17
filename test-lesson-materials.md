# Testing Lesson-Material Management

## New Endpoints Added ✅

### 1. Add Material to Lesson
```bash
POST /lessons/{lessonId}/materials
Content-Type: application/json
Authorization: Bearer {your-jwt-token}

{
  "title": "HTML Cheat Sheet",
  "fileUrl": "https://example.com/html-cheatsheet.pdf"
}
```

### 2. Get Materials by Lesson
```bash
GET /materials/lesson/{lessonId}
```

## Test Scenarios

### Test 1: Create Lesson First
```bash
POST /courses/{courseId}/lessons
Content-Type: application/json
Authorization: Bearer {your-jwt-token}

{
  "title": "Introduction to Bartending",
  "content": "Basic instructions for beginners"
}
```

### Test 2: Add Material to Lesson
```bash
POST /lessons/{lessonId}/materials
Content-Type: application/json
Authorization: Bearer {your-jwt-token}

{
  "title": "Bartending Tools Guide",
  "fileUrl": "https://example.com/tools-guide.pdf"
}
```

**Expected Result**: Material created and associated with the lesson

### Test 3: Get Lesson Materials
```bash
GET /materials/lesson/{lessonId}
```

**Expected Result**: Array of materials associated with the lesson

### Test 4: Add Multiple Materials to Lesson
```bash
POST /lessons/{lessonId}/materials
Content-Type: application/json
Authorization: Bearer {your-jwt-token}

{
  "title": "Cocktail Recipes",
  "fileUrl": "https://example.com/recipes.pdf"
}
```

```bash
POST /lessons/{lessonId}/materials
Content-Type: application/json
Authorization: Bearer {your-jwt-token}

{
  "title": "Safety Guidelines",
  "fileUrl": "https://example.com/safety.pdf"
}
```

### Test 5: Verify Material Association
```bash
GET /lessons/{lessonId}
```

**Expected Result**: Lesson with materials array showing all associated materials

## Material Organization

### **Course-Level vs Lesson-Level Materials**

**Course Materials** (`POST /courses/:id/materials`):
- Course syllabus
- Course overview
- General guidelines
- Course completion certificate

**Lesson Materials** (`POST /lessons/:id/materials`):
- Lesson-specific worksheets
- Practice exercises
- Reference materials
- Lesson completion quizzes

## Database Structure

Materials now have two optional relationships:
- `courseId`: For course-level materials
- `lessonId`: For lesson-level materials

A material can be:
- **Course-only**: `courseId` set, `lessonId` null
- **Lesson-only**: `lessonId` set, `courseId` set (from lesson)
- **Both**: `courseId` and `lessonId` set

## Benefits

1. **Organized Content**: Materials are logically grouped by lesson
2. **Flexible Structure**: Can have both course and lesson materials
3. **Easy Retrieval**: Get materials by course or by lesson
4. **Better UX**: Students can find lesson-specific resources easily

## Test the Complete Flow

1. **Create Course** → `POST /courses`
2. **Add Lesson** → `POST /courses/{courseId}/lessons`
3. **Add Course Material** → `POST /courses/{courseId}/materials`
4. **Add Lesson Material** → `POST /lessons/{lessonId}/materials`
5. **View Course Materials** → `GET /courses/{courseId}/materials`
6. **View Lesson Materials** → `GET /materials/lesson/{lessonId}`
7. **View Lesson with Materials** → `GET /lessons/{lessonId}`

This creates a complete, organized learning structure! 🎉
