<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fo="http://www.w3.org/1999/XSL/Format">
	<xsl:output method="html" encoding="UTF-8" indent="yes"/>
	
	<xsl:template match="symbols">
		<html>
			<head>
				<title>Symbolen</title>
			</head>
			<body>

				<table border="1" style="border-collapse: collapse">
					<tbody>
						<tr>
							<th>Code</th>
							<th>Naam</th>
							<th>Symbool</th>
							<th>Namespace</th>
							<th>Categorie</th>
							<!--th>Omschrijving</th-->
						</tr>
						<xsl:for-each select="symbol">
							<xsl:variable name="namespaceLower" select="translate(namespace, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')"/>
							<xsl:variable name="bgcol">
								<xsl:choose>
									<xsl:when test="categorie='objectinformatie'">2B941E</xsl:when>
									<xsl:when test="categorie='preparatief'">F1FA4B</xsl:when>
									<xsl:when test="categorie='preventief'">558AED</xsl:when>
									<xsl:when test="categorie='repressief'">E62525</xsl:when>
								</xsl:choose>
							</xsl:variable>
							<tr>
								<td><xsl:value-of select="type"/></td>
								<td><xsl:value-of select="naam"/></td>
								<td><img alt="{naam}" src="public/images/{$namespaceLower}/{type}.png" height="32px"/></td>
								<td><xsl:value-of select="namespace"/></td>
								<td style="background: #{$bgcol}"><xsl:value-of select="categorie"/></td>
								<!--td><xsl:value-of select="omschrijving"/></td-->
							</tr>
						</xsl:for-each>
					</tbody>
					
				</table>
			</body>
		
		</html>
	</xsl:template>
</xsl:stylesheet>
