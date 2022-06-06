## Examples

```
python3 cli/fractal_stl_maker.py \
    --output-location ~/Desktop/juliaFractal.stl \
    --window-height 400 \
    --window-width 400 \
    --iterations 80 \
    --vertical-scale 0.2 \
    --base-height 40 \
    --type inset
```

![Alt text](Inset_Example.png?raw=true "Example inset fractal STL")

```
python3 cli/fractal_stl_maker.py \
    --output-location ~/Desktop/juliaFractal.stl \
    --window-height 400 \
    --window-width 400 \
    --iterations 80 \
    --vertical-scale 0.2 \
    --base-height 10 \
    -ji 0.1 -jr -0.767 \
    --type extrude
```

![Alt text](Extrude_Example.png?raw=true "Example extrude fractal STL")
