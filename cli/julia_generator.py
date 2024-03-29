import math

class JuliaGridGenerator(object):

    def __init__(self, x_min, x_max, y_min, y_max):
        self.window_x_center = float(x_min + x_max)/2
        self.window_y_center = float(y_min + y_max)/2
        self.window_width = float(x_max - x_min)
        self.window_height = float(y_max - y_min)

    def compute_julia_map(self, grid_width, grid_height, imaginary_constant, real_constant, iterations, floor):

        result_grid = [[iterations for i in range(grid_height + 1)] for j in range(grid_width + 1)]

        for i in range(grid_width + 1):
            for j in range(grid_height + 1):
                x_vector = self.window_x_center \
                    + (self.window_width/grid_width)*i \
                    - self.window_width/2

                y_vector = self.window_y_center \
                    + (self.window_height/grid_height)*j \
                    - self.window_height/2

                next_x_vector = x_vector*x_vector
                next_y_vector = y_vector*y_vector

                for n in range(iterations):
                    if next_x_vector + next_y_vector > 4:
                        result_grid[i][j] = max(n - floor, 0)
                        break
                    x_vector = 2*x_vector*y_vector + imaginary_constant
                    y_vector = next_y_vector - next_x_vector + real_constant
                    next_x_vector = x_vector*x_vector
                    next_y_vector = y_vector*y_vector
        return result_grid
