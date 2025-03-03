import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign, verify } from 'hono/jwt'

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string
  }
}>()

app.use('/api/v1/blog/*', async (c, next) => {
  // get the header
  // verify the header is valid
  // if the header is correct then we need to proceed
  // if not we return 403
  const header = c.req.header("authorization") || ""
  const token  = header.split(" ")[1]
  const response =await verify(token,"secret")
  if(response.id){
    next()
  }
  else{
    c.status(403);
    return c.json({ error: "Invalid token" });
  }
})
// ...existing code...
app.post('/api/v1/user/signup', async(c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const body = await c.req.json()
    console.log(body.email)
    console.log(body.password)
    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: body.password
      }
    })
    console.log("ag=f")
    console.log(user.email)
    const jwt = await sign({ id: user.id },"secret");
    return c.json({ jwt });
  } catch (e) {
    c.status(403);
    return c.json({ error:"Error creating user"})
  }
})








app.post('/api/v1/user/signin', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL	,
	}).$extends(withAccelerate());

	const body = await c.req.json();
	const user = await prisma.user.findUnique({
		where: {
			email: body.email
		}
	});

	if (!user) {
		c.status(403);
		return c.json({ error: "user not found" });
	}

	const jwt = await sign({ id: user.id },"secret");
	return c.json({ jwt });
})
export default app
