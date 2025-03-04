import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign, verify } from 'hono/jwt'
import { Hono } from "hono";
import { signupInput,signinInput } from "@nilesh_01/medium-common1";
export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string
  }
}>()

userRouter.post('/signup', async(c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const body = await c.req.json()
    const {success} = signupInput.safeParse(body);
    if(!success){
      c.status(411)
      return c.json({error:"Invalid input"})
    }
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
    return c.json({ error:e})
  }
})

userRouter.post('/signin', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL	,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const {success} = signinInput.safeParse(body);
    if(!success){
      c.status(411)
      return c.json({error:"Invalid input"})
    }
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
