import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { Hono } from 'hono';
import { verify } from 'hono/jwt';

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string
  },
  Variables: {
    userId: string
  }
}>();
blogRouter.use('/*', async(c, next) => {
  // extract the user id
  // pass the user id
  const authHeader =  c.req.header("authorization")|| "";
  const user = await verify(authHeader, "secret")
  console.log(user.id)
  if(user){

    c.set("userId", user.id as string);
    await next();
  }
  else{
    return c.json({ message: 'not logged in' }, 401);
  }
});

blogRouter.post('/', async (c) => {
  const body = await c.req.json();
  const authorId = c.get("userId");
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const blog  = await prisma.post.create({
    data:
    {
      title: body.title,
      content: body.content,
      authorId: authorId
      },
  });
  return c.json({
    id: blog.id,
  });
});
blogRouter.put('/', async(c) => {
  const body = await c.req.json();
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const blog  = await prisma.post.update({
    where: {
      id:body.id
    },
    data:
    {
      title: body.title,
      content: body.content,
      },
  });
  return c.json({
    id: blog.id,
  });
});
blogRouter.get('/bulk', async(c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const blogs =await prisma.post.findMany();
  return c.json({blogs});
});
blogRouter.get('/',async (c) => {
  const body = await c.req.json()
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  try{
    const blog  = await prisma.post.findFirst({
    where:{
      id:body.id
    }
  });
  console.log(blog)
  return c.json({
    blog
  });
  }
  catch(e){
    c.status(411)
    return c.json({ message :"error while fetching blog" });
  }
});
// Todo add pagination

