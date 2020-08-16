Getting started

The structure of this article is going to be from abstract and theoretical idea to specific mathematical implementation. Let's start by looking at the problem we are trying to solve. A pan-zoom component is really a two-in-one component; it has both output and accepts input. Having both input and output makes it interactive. We can't really give useful input without seeing the output (imagine trying to pan and zoom with a blank rectangle on screen), so let's figure out how to make the output work before we start on the input.

It presents something that you can see, or really, it presents part of something. Let's call that something the model, it could be a picture, a map, a timeline or something else. The reason we need a pan-zoom component is because this model is bigger and more detailed than screens can present or we humans can appreciate all at once. Therefore we want a way to only see a small part of it. We therefore have a view of the model where we only see parts of it, maybe in greater detail than we would if we saw the whole model at once. 

The view is going to be a rectangle on screen with a certain dimension, and inside this rectangle we will see (part of) the model. We need some way to decide what part of the model to present in the view. Probably the most common way to do this in computer graphics is using a transformation matrix (or, since we will only deal with 2D graphics in this article, an affine transformation matrix). With this matrix we can convert a point in the model to a point on the screen. Matrices can be a bit weird if you are new to them, but don't worry, we don't really need to fully understand them here. Think of them like any other tool; you don't need to understand how they work to know that they can be useful. 

The transformation matrix describes where a point in the model, for example a coordinate in a map or a pixel in an image, is going to be drawn on screen inside the view. 

bla bla

v = Tm

So when we interact with the model through the view, how do we make it move? It should feel natural, like we are dragging the model across the screen. It should feel like we are dragging a playing card across a table. That is, when we place our finger on a point and move the finger, the point should follow our finger across the screen. In terms of the model, the view and the transformation matrix, when we start dragging some point in the view, we need to find which point that represents in the model. Then when we move our finger the point in the view changes, but the point in the model should not. So we need to find out how to transform the model so that the poinst line up again. This is a convoluted sentence.

Our goal is to find the transformation matrix that makes the coordinates in the model map to the coordinates in the view, when the coordinates in the view changes. 

The way to do this is to solve the equation we had before

T = m^-1*v

Single-touch



Multi-touch

So it's time for multi touch. We now have not just one finger on the screen, but two or more touch points. That means two or more points in the model and in the view. We still have the same basic equation.

v = Tm

But now the view and the model contain multiple sets of coordinates

[x_v1 x_v2 ... x_vn] = [s 0 x_t][x_m1 x_m2 ... x_mn]
[y_v1 y_v2 ... y_vn] = [0 s y_t][y_m1 y_m2 ... y_mn]
[1    1    ... 1   ] = [0 0 1  ][1    1    ... 1   ]

When we had just one set of coordinates we multiplied this matrix out and solved for x_t and y_t, and that was straight forward since we had two equations and two unknowns. This time however we have three unknowns (x_t, y_t and s) and, if we multiply it out...

x_v1 = s*x_m1 + x_t
y_v1 = s*y_m1 + y_t
x_v2 = s*x_m2 + x_t
y_v2 = s*y_m2 + y_t
...
x_vn = s*x_mn + x_t
y_vn = s*y_mn + y_t

...2*n equations. This, having more equations than unknowns, is called overfitting, and means that we might not find an exact solution. But we can find the best fit solution, the solution with the least error. Formally this is known as the least squares solution, where the sum of the squares of the errors is minimized. That's a lot of math speak that we don't need to understand, we just want a good enough approximation, and this method will give us that. It relies on matrix multiplication to try to solve for x in

Ax = b

by multiplying both sides with the inverse of A, A^-1

A^-1Ax = A^-1b

and since A^-1A = I, the identity matrix, this simplifies to

x = A^-1b

This only works if A is a square matrix and x is a vector (it only has 1 column). Let's group our set of equations into matrices and vectors and see what it looks like.

[1 0 x_m1][x_t] = [x_v1]
[0 1 y_m1][y_t] = [y_v1]
[1 0 x_m2][s  ] = [x_m2]
[0 1 y_m2]      = [y_m2]
...

[1 0 x_mn]      = [x_mn]
[0 1 y_mn]      = [y_mn]

so x is a vector with 3 elements, that's good, but A is a 3*2n matrix, that's not good. But there is a way to solve it. We can find a pseudo inverse by multiplying A with the transpose of A, A^T. A^T*A produces a square matrix, so we can invert that. The result is that we end up with

x = (A^T*A)^-1*A^T*b

