# MongoDB Patterns - Database Design

**Scope:** backend
**Trigger:** cuando se diseñen schemas de MongoDB, se implementen relaciones entre documentos, o se optimicen queries
**Tools:** view, file_create, str_replace, bash_tool
**Version:** 1.0.0

---

## Propósito

Esta skill te guía para diseñar schemas eficientes en MongoDB y Mongoose. Cubre patrones de relaciones, indexación, aggregation pipeline, transacciones y optimización de queries.

## Cuándo Usar Esta Skill

- Diseñar schema de base de datos para nueva feature
- Decidir entre embedded vs referenced documents
- Optimizar queries lentas
- Implementar relaciones complejas
- Usar aggregation pipeline para reportes
- Configurar índices para performance
- Implementar transacciones multi-documento

## Contexto y Conocimiento

### Filosofía de MongoDB

**Document-Oriented:**
- Datos relacionados se almacenan juntos
- Evita JOINs cuando sea posible
- Desnormalización es común y buena práctica

**Flexible Schema:**
- No requiere estructura fija
- Documentos en la misma colección pueden tener diferentes campos
- Evolución del schema es fácil

## Patrones de Relaciones

### 1. Embedded Documents (One-to-Few)

**Cuándo usar:**
- Relación 1:N donde N es pequeño (< 100)
- Los datos embedded se acceden siempre con el padre
- Los datos embedded no crecen sin límite

**Ejemplo - Usuario con Direcciones:**
```javascript
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  addresses: [
    {
      street: String,
      city: String,
      zipCode: String,
      type: { type: String, enum: ['home', 'work'] },
    }
  ],
});

// Query simple - obtiene usuario con todas sus direcciones
const user = await User.findById(userId);
console.log(user.addresses); // Todas las direcciones
```

**Ventajas:**
- Query sencilla (un solo fetch)
- Atomic operations
- Mejor performance para lectura

**Desventajas:**
- Documento puede crecer mucho (límite 16MB)
- No se puede referenciar sub-documento directamente

### 2. Child Referencing (One-to-Many)

**Cuándo usar:**
- Relación 1:N donde N es grande (100+)
- Los child documents se acceden independientemente
- Los child documents pueden estar en múltiples parents

**Ejemplo - Usuario con Posts:**
```javascript
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

// Query con populate
const posts = await Post.find({ author: userId })
  .populate('author', 'name email')
  .sort({ createdAt: -1 });
```

**Ventajas:**
- No hay límite de tamaño
- Child documents independientes
- Flexible y escalable

**Desventajas:**
- Requiere múltiples queries (o populate)
- No atomic por defecto

### 3. Parent Referencing (One-to-Many Inverso)

**Cuándo usar:**
- Necesitas acceder al parent desde el child
- Los children pueden tener diferentes parents

**Ejemplo - Comentarios con Parent:**
```javascript
const commentSchema = new mongoose.Schema({
  text: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  },
  createdAt: { type: Date, default: Date.now },
});

// Query comments de un post
const comments = await Comment.find({ post: postId })
  .populate('author', 'name')
  .sort({ createdAt: -1 });
```

### 4. Two-Way Referencing (Many-to-Many)

**Cuándo usar:**
- Relación N:M
- Necesitas acceder desde ambos lados frecuentemente

**Ejemplo - Usuarios y Cursos:**
```javascript
const userSchema = new mongoose.Schema({
  name: String,
  enrolledCourses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    }
  ],
});

const courseSchema = new mongoose.Schema({
  title: String,
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  ],
});

// Query: cursos de un usuario
const user = await User.findById(userId).populate('enrolledCourses');

// Query: estudiantes de un curso
const course = await Course.findById(courseId).populate('students');
```

**Importante:** Mantener ambos lados sincronizados:
```javascript
// Método para enrollar usuario
userSchema.methods.enrollInCourse = async function(courseId) {
  // Agregar curso al usuario
  this.enrolledCourses.push(courseId);
  await this.save();

  // Agregar usuario al curso
  await Course.findByIdAndUpdate(
    courseId,
    { $addToSet: { students: this._id } }
  );
};
```

### 5. Denormalization Pattern

**Cuándo usar:**
- Queries de lectura muy frecuentes
- Datos que no cambian mucho
- Dispuesto a sacrificar consistencia por performance

**Ejemplo - Posts con Author Info:**
```javascript
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name: String, // Denormalizado
    avatar: String, // Denormalizado
  },
  likes: Number,
  createdAt: { type: Date, default: Date.now },
});

// Query super rápida - no requiere populate
const posts = await Post.find().sort({ createdAt: -1 });
// posts[0].author.name está disponible inmediatamente
```

**Trade-off:**
- Queries ultra rápidas
- Necesitas actualizar datos denormalizados cuando cambian

```javascript
// Cuando el usuario cambia su nombre
userSchema.post('save', async function() {
  if (this.isModified('name')) {
    await Post.updateMany(
      { 'author.id': this._id },
      { $set: { 'author.name': this.name } }
    );
  }
});
```

## Indexación para Performance

### Tipos de Índices

**Single Field Index:**
```javascript
userSchema.index({ email: 1 }); // Ascendente
userSchema.index({ createdAt: -1 }); // Descendente
```

**Compound Index:**
```javascript
// Query: find({ user: userId, status: 'active' })
taskSchema.index({ user: 1, status: 1 });

// Query con sort: find().sort({ createdAt: -1 })
taskSchema.index({ user: 1, createdAt: -1 });
```

**Text Index (para búsqueda):**
```javascript
postSchema.index({ title: 'text', content: 'text' });

// Query
const results = await Post.find(
  { $text: { $search: 'mongodb tutorial' } }
);
```

**Unique Index:**
```javascript
userSchema.index({ email: 1 }, { unique: true });
```

**Sparse Index (solo documentos con el campo):**
```javascript
// Solo indexa usuarios con phoneNumber
userSchema.index({ phoneNumber: 1 }, { sparse: true });
```

### Estrategias de Indexación

```javascript
// BIEN - Índice compuesto eficiente
// Query: find({ user: X, status: Y }).sort({ priority: -1 })
taskSchema.index({ user: 1, status: 1, priority: -1 });

// MAL - Índices redundantes
taskSchema.index({ user: 1 });
taskSchema.index({ user: 1, status: 1 }); // Este cubre el anterior

// Regla: El índice compuesto puede servir queries de prefijos
// Índice { a: 1, b: 1, c: 1 } sirve para:
// - { a }
// - { a, b }
// - { a, b, c }
// Pero NO para { b } o { c }
```

### Analizar Performance

```javascript
// Explicar query plan
const explain = await Post.find({ author: userId })
  .sort({ createdAt: -1 })
  .explain('executionStats');

console.log(explain.executionStats.totalDocsExamined); // Documentos escaneados
console.log(explain.executionStats.executionTimeMillis); // Tiempo

// Si totalDocsExamined >> nReturned, necesitas índice
```

## Aggregation Pipeline

### Casos de Uso Comunes

**1. Group By y Count:**
```javascript
// Contar posts por usuario
const postsByUser = await Post.aggregate([
  {
    $group: {
      _id: '$author',
      count: { $sum: 1 },
      totalLikes: { $sum: '$likes' },
    }
  },
  { $sort: { count: -1 } },
  { $limit: 10 },
]);
```

**2. Lookup (JOIN):**
```javascript
// Posts con información de autor (sin populate)
const postsWithAuthors = await Post.aggregate([
  {
    $lookup: {
      from: 'users',
      localField: 'author',
      foreignField: '_id',
      as: 'authorInfo',
    }
  },
  { $unwind: '$authorInfo' },
  {
    $project: {
      title: 1,
      content: 1,
      'authorInfo.name': 1,
      'authorInfo.email': 1,
    }
  },
]);
```

**3. Match y Project:**
```javascript
// Posts activos con campos específicos
const activePosts = await Post.aggregate([
  { $match: { status: 'active', likes: { $gte: 10 } } },
  {
    $project: {
      title: 1,
      likes: 1,
      authorName: '$author.name',
      likesCategory: {
        $switch: {
          branches: [
            { case: { $lt: ['$likes', 10] }, then: 'low' },
            { case: { $lt: ['$likes', 50] }, then: 'medium' },
          ],
          default: 'high',
        }
      }
    }
  },
  { $sort: { likes: -1 } },
]);
```

**4. Estadísticas Complejas:**
```javascript
// Dashboard stats
const stats = await Order.aggregate([
  {
    $match: {
      createdAt: { $gte: new Date('2024-01-01') },
      status: 'completed',
    }
  },
  {
    $group: {
      _id: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      },
      totalOrders: { $sum: 1 },
      totalRevenue: { $sum: '$total' },
      avgOrderValue: { $avg: '$total' },
    }
  },
  { $sort: { '_id.year': -1, '_id.month': -1 } },
]);
```

## Transacciones

### Cuándo Usar Transacciones

- Operaciones que deben ser atómicas
- Múltiples documentos/colecciones
- Rollback necesario si falla algo

**Ejemplo - Transferencia de Fondos:**
```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Retirar de cuenta origen
  await Account.findByIdAndUpdate(
    fromAccountId,
    { $inc: { balance: -amount } },
    { session }
  );

  // Depositar en cuenta destino
  await Account.findByIdAndUpdate(
    toAccountId,
    { $inc: { balance: amount } },
    { session }
  );

  // Crear registro de transacción
  await Transaction.create([{
    from: fromAccountId,
    to: toAccountId,
    amount,
    timestamp: new Date(),
  }], { session });

  // Commit
  await session.commitTransaction();
  console.log('Transaction successful');
} catch (error) {
  // Rollback
  await session.abortTransaction();
  console.error('Transaction failed:', error);
  throw error;
} finally {
  session.endSession();
}
```

## Patrones Avanzados

### 1. Bucket Pattern (Optimización de Series Temporales)

**Problema:** Millones de readings de sensores
```javascript
// MAL - Un documento por reading
{ sensor: 'A', temp: 20, time: ISODate() }
{ sensor: 'A', temp: 21, time: ISODate() }
// Millones de documentos...
```

**Solución:** Agrupar en buckets
```javascript
// BIEN - Bucket por hora
{
  sensor: 'A',
  date: ISODate('2024-01-01T10:00:00'),
  measurements: [
    { temp: 20, time: ISODate('2024-01-01T10:00:01') },
    { temp: 21, time: ISODate('2024-01-01T10:00:02') },
    // ... hasta 3600 readings (1 hora)
  ]
}
```

### 2. Computed Pattern (Pre-calcular Datos)

```javascript
const orderSchema = new mongoose.Schema({
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      price: Number,
    }
  ],
  // Pre-calculado
  subtotal: Number,
  tax: Number,
  total: Number,
});

// Pre middleware para calcular
orderSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce((sum, item) =>
    sum + (item.price * item.quantity), 0
  );
  this.tax = this.subtotal * 0.16;
  this.total = this.subtotal + this.tax;
  next();
});
```

### 3. Polymorphic Pattern

```javascript
// Diferentes tipos de posts
const contentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['article', 'video', 'image'],
    required: true,
  },
  title: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Campos específicos por tipo
  article: {
    text: String,
    wordCount: Number,
  },
  video: {
    url: String,
    duration: Number,
  },
  image: {
    url: String,
    width: Number,
    height: Number,
  },
}, { discriminatorKey: 'type' });

// Query por tipo
const articles = await Content.find({ type: 'article' });
```

## Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| Document too large (>16MB) | Demasiados embedded docs | Usar referencing en su lugar |
| Slow queries | Sin índices apropiados | Analizar con .explain() y agregar índices |
| Memory leak en queries | Cursor sin cerrar | Usar .lean() o streams |
| Inconsistent data | Update de denormalized data | Usar transactions o middleware hooks |
| N+1 queries | Populate en loops | Usar populate con arrays o aggregation |

## Checklist de Schema Design

Antes de implementar un schema:
- [ ] Relación correcta (embedded vs referenced)
- [ ] Índices necesarios definidos
- [ ] Validaciones en el schema
- [ ] Valores por defecto apropiados
- [ ] Timestamps (createdAt, updatedAt)
- [ ] Soft delete si es necesario (deletedAt)
- [ ] Índice unique donde corresponde
- [ ] Pre/Post hooks si se requieren
- [ ] Métodos custom del modelo documentados
- [ ] Schema probado con datos reales

## Best Practices

1. **Design for your query patterns** - No para normalización perfecta
2. **Denormalize when read >> write** - Trading-off consistency for speed
3. **Index strategically** - No todos los campos necesitan índice
4. **Use lean() for read-only** - 5x más rápido que documentos Mongoose completos
5. **Batch operations when possible** - bulkWrite() es más eficiente
6. **Monitor slow queries** - Habilita profiling en MongoDB
7. **Use projections** - No retornes campos innecesarios
8. **Consider TTL indexes** - Para datos temporales (sessions, logs)

---

**Última actualización:** Fase 2 - Skills MERN
**Mantenedor:** Sistema de Skills
**Siguiente:** Integrar patrones en apps reales con Express
