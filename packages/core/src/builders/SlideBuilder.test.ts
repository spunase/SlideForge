import { buildSlideXml, type SlideShape } from './SlideBuilder';

describe('buildSlideXml', () => {
  it('should produce valid XML declaration', () => {
    const xml = buildSlideXml([]);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
  });

  it('should contain the p:sld root element with correct namespaces', () => {
    const xml = buildSlideXml([]);
    expect(xml).toContain('<p:sld');
    expect(xml).toContain('xmlns:a=');
    expect(xml).toContain('xmlns:r=');
    expect(xml).toContain('xmlns:p=');
  });

  it('should contain p:cSld and p:spTree elements', () => {
    const xml = buildSlideXml([]);
    expect(xml).toContain('<p:cSld>');
    expect(xml).toContain('<p:spTree>');
    expect(xml).toContain('</p:spTree>');
    expect(xml).toContain('</p:cSld>');
  });

  it('should contain color map override', () => {
    const xml = buildSlideXml([]);
    expect(xml).toContain('<p:clrMapOvr>');
    expect(xml).toContain('<a:masterClrMapping/>');
  });

  it('should render a text shape as p:sp', () => {
    const shapes: SlideShape[] = [
      {
        id: 2,
        name: 'TextBox1',
        type: 'text',
        x: 100,
        y: 200,
        width: 500,
        height: 300,
        textRuns: [
          {
            text: 'Hello',
            fontFamily: 'Arial',
            fontSize: 12,
            fontWeight: 'normal',
            fontStyle: 'normal',
            color: 'FF0000',
            underline: false,
          },
        ],
      },
    ];

    const xml = buildSlideXml(shapes);
    expect(xml).toContain('<p:sp>');
    expect(xml).toContain('id="2"');
    expect(xml).toContain('name="TextBox1"');
    expect(xml).toContain('<a:off x="100" y="200"/>');
    expect(xml).toContain('<a:ext cx="500" cy="300"/>');
    expect(xml).toContain('<a:t>Hello</a:t>');
  });

  it('should render bold and italic text run properties', () => {
    const shapes: SlideShape[] = [
      {
        id: 2,
        name: 'Bold',
        type: 'text',
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        textRuns: [
          {
            text: 'Bold Italic',
            fontFamily: 'Arial',
            fontSize: 14,
            fontWeight: 'bold',
            fontStyle: 'italic',
            color: '000000',
            underline: true,
          },
        ],
      },
    ];

    const xml = buildSlideXml(shapes);
    expect(xml).toContain('b="1"');
    expect(xml).toContain('i="1"');
    expect(xml).toContain('u="sng"');
  });

  it('should render font size in hundredths of a point', () => {
    const shapes: SlideShape[] = [
      {
        id: 2,
        name: 'FontSize',
        type: 'text',
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        textRuns: [
          {
            text: 'Test',
            fontFamily: 'Arial',
            fontSize: 24,
            fontWeight: 'normal',
            fontStyle: 'normal',
            color: '000000',
            underline: false,
          },
        ],
      },
    ];

    const xml = buildSlideXml(shapes);
    expect(xml).toContain('sz="2400"'); // 24pt * 100
  });

  it('should render a rect shape with solid fill', () => {
    const shapes: SlideShape[] = [
      {
        id: 3,
        name: 'Rect1',
        type: 'rect',
        x: 10,
        y: 20,
        width: 300,
        height: 200,
        fill: { type: 'solid', color: '00FF00' },
      },
    ];

    const xml = buildSlideXml(shapes);
    expect(xml).toContain('<a:solidFill>');
    expect(xml).toContain('val="00FF00"');
  });

  it('should render no fill for none fill type', () => {
    const shapes: SlideShape[] = [
      {
        id: 3,
        name: 'Rect2',
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fill: { type: 'none' },
      },
    ];

    const xml = buildSlideXml(shapes);
    expect(xml).toContain('<a:noFill/>');
  });

  it('should render a gradient fill', () => {
    const shapes: SlideShape[] = [
      {
        id: 3,
        name: 'GradRect',
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fill: {
          type: 'gradient',
          angle: 90,
          stops: [
            { position: 0, color: 'FF0000' },
            { position: 100000, color: '0000FF' },
          ],
        },
      },
    ];

    const xml = buildSlideXml(shapes);
    expect(xml).toContain('<a:gradFill>');
    expect(xml).toContain('<a:gsLst>');
    expect(xml).toContain('<a:lin');
  });

  it('should render a border as a:ln', () => {
    const shapes: SlideShape[] = [
      {
        id: 3,
        name: 'Bordered',
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        border: { width: 12700, color: 'FF0000' },
      },
    ];

    const xml = buildSlideXml(shapes);
    expect(xml).toContain('<a:ln w="12700">');
    expect(xml).toContain('val="FF0000"');
  });

  it('should render border dash style', () => {
    const shapes: SlideShape[] = [
      {
        id: 3,
        name: 'Dashed',
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        border: { width: 9525, color: '000000', dashStyle: 'dash' },
      },
    ];

    const xml = buildSlideXml(shapes);
    expect(xml).toContain('<a:prstDash val="dash"/>');
  });

  it('should render rounded rectangle when border has radius', () => {
    const shapes: SlideShape[] = [
      {
        id: 3,
        name: 'Rounded',
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        border: { width: 9525, color: '000000', radius: 50000 },
      },
    ];

    const xml = buildSlideXml(shapes);
    expect(xml).toContain('prst="roundRect"');
    expect(xml).toContain('name="adj"');
  });

  it('should render shadow as a:effectLst with a:outerShdw', () => {
    const shapes: SlideShape[] = [
      {
        id: 3,
        name: 'Shadowed',
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        shadow: {
          blurRad: 50800,
          dist: 38100,
          dir: 2700000,
          color: '000000',
          alpha: 0.5,
        },
      },
    ];

    const xml = buildSlideXml(shapes);
    expect(xml).toContain('<a:effectLst>');
    expect(xml).toContain('<a:outerShdw');
    expect(xml).toContain('blurRad="50800"');
    expect(xml).toContain('dist="38100"');
    expect(xml).toContain('dir="2700000"');
  });

  it('should render an image shape as p:pic', () => {
    const shapes: SlideShape[] = [
      {
        id: 4,
        name: 'Image1',
        type: 'image',
        x: 100,
        y: 200,
        width: 400,
        height: 300,
        imageRId: 'rId5',
      },
    ];

    const xml = buildSlideXml(shapes);
    expect(xml).toContain('<p:pic>');
    expect(xml).toContain('r:embed="rId5"');
    expect(xml).toContain('<a:picLocks noChangeAspect="1"/>');
  });

  it('should escape XML special characters in text content', () => {
    const shapes: SlideShape[] = [
      {
        id: 2,
        name: 'Escaped',
        type: 'text',
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        textRuns: [
          {
            text: 'A & B < C > D',
            fontFamily: 'Arial',
            fontSize: 12,
            fontWeight: 'normal',
            fontStyle: 'normal',
            color: '000000',
            underline: false,
          },
        ],
      },
    ];

    const xml = buildSlideXml(shapes);
    expect(xml).toContain('A &amp; B &lt; C &gt; D');
  });

  it('should produce empty text body for shape without text runs', () => {
    const shapes: SlideShape[] = [
      {
        id: 2,
        name: 'NoText',
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      },
    ];

    const xml = buildSlideXml(shapes);
    expect(xml).toContain('<p:txBody>');
    expect(xml).toContain('<a:endParaRPr');
  });

  it('should render multiple shapes', () => {
    const shapes: SlideShape[] = [
      {
        id: 2,
        name: 'Shape1',
        type: 'rect',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      },
      {
        id: 3,
        name: 'Shape2',
        type: 'rect',
        x: 200,
        y: 200,
        width: 100,
        height: 100,
      },
    ];

    const xml = buildSlideXml(shapes);
    expect(xml).toContain('name="Shape1"');
    expect(xml).toContain('name="Shape2"');
  });
});
